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
 */

export interface OptionLineInput {
  unitPrice: number;
  priceType: OptionPriceType;
  quantity: number;
}

export function computeOptionLineTotal(
  line: OptionLineInput,
  numberOfDays: number
): number {
  if (line.priceType === "per_day") {
    return line.unitPrice * line.quantity * numberOfDays;
  }
  return line.unitPrice * line.quantity;
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
