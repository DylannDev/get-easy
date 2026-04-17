import type { OptionPriceType } from "../option.entity";

/**
 * Pricing rules for rental options.
 *
 *  - `per_day` options are billed `unitPrice * quantity * numberOfDays`.
 *  - `flat`    options are billed `unitPrice * quantity` (one-shot, regardless
 *              of rental duration).
 *
 * `numberOfDays` is the billed day count from `quotePrice` — any started day
 * counts.
 *
 * Monthly cap (phase 7A) :
 *   Applies only to `per_day` options with `capEnabled` + `monthlyCap` set.
 *   Each rolling 30-day window has its OWN cap — the cap resets at the start
 *   of each new 30-day block.
 *
 *   Rule : the rental is split into complete 30-day months + a remainder.
 *     - complete months → each billed `min(30 × unitPrice, monthlyCap)` which
 *       equals `monthlyCap` as soon as the daily price would exceed it
 *     - remainder days  → billed `min(remainingDays × unitPrice, monthlyCap)`
 *     - multiplied by quantity
 *
 *   Example : 5 €/j, plafond 50 €/mois (cap atteint en 10 jours)
 *     - 10 j → 50 €
 *     - 15 j → 50 € (plafond atteint)
 *     - 30 j → 50 €
 *     - 31 j → 50 + min(5, 50) = 55 €
 *     - 35 j → 50 + min(25, 50) = 75 €
 *     - 60 j → 50 + 50 = 100 €
 */

const DAYS_PER_MONTH = 30;

export interface OptionLineInput {
  unitPrice: number;
  priceType: OptionPriceType;
  quantity: number;
  /** Plafond mensuel unitaire (€) — ignoré si priceType !== "per_day". */
  monthlyCap?: number | null;
}

export function computeOptionLineTotal(
  line: OptionLineInput,
  numberOfDays: number
): number {
  if (line.priceType !== "per_day") {
    return line.unitPrice * line.quantity;
  }

  if (line.monthlyCap === null || line.monthlyCap === undefined) {
    return line.unitPrice * line.quantity * numberOfDays;
  }

  // Découpe en mois complets (30 j) + reste. Chaque bloc applique son
  // propre plafond.
  const completeMonths = Math.floor(numberOfDays / DAYS_PER_MONTH);
  const remainingDays = numberOfDays % DAYS_PER_MONTH;

  const fullMonthCost = Math.min(
    DAYS_PER_MONTH * line.unitPrice,
    line.monthlyCap
  );
  const remainderCost = Math.min(
    remainingDays * line.unitPrice,
    line.monthlyCap
  );

  const unitTotal = completeMonths * fullMonthCost + remainderCost;
  return unitTotal * line.quantity;
}

export function computeOptionsTotal(
  lines: readonly OptionLineInput[],
  numberOfDays: number
): number {
  return lines.reduce(
    (acc, line) => acc + computeOptionLineTotal(line, numberOfDays),
    0
  );
}

/**
 * Nombre de tranches mensuelles entamées pour une durée donnée.
 * Utile pour afficher côté UI : "Plafonné à 50 €/mois × 2 mois = 100 €".
 */
export function monthsStartedFor(numberOfDays: number): number {
  return Math.max(1, Math.ceil(numberOfDays / DAYS_PER_MONTH));
}
