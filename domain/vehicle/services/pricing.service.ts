import type { PricingTier } from "../pricing-tier.vo";

/**
 * Vehicle pricing — single source of truth.
 *
 * Replaces the previous duplicated implementations:
 *  - lib/utils.ts            → getPricePerDay(), calculateTotalPrice()
 *  - hooks/use-booking-summary.ts → inline price computation
 *  - actions/create-booking.ts    → inline price computation
 *
 * Rules:
 *  - Total days = ceil((end - start) / 24h). Any started day is billed.
 *  - Applicable tier = the tier with the highest `minDays` <= totalDays.
 *  - Tiers are assumed sorted ascending by `minDays`. The service sorts
 *    defensively to remain robust to unsorted input.
 */

export interface PriceQuote {
  totalDays: number;
  pricePerDay: number;
  totalPrice: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Returns the applicable price per day for a rental of `days` days.
 * Throws if no tiers are provided.
 */
export function getApplicablePricePerDay(
  days: number,
  tiers: readonly PricingTier[]
): number {
  if (!tiers || tiers.length === 0) {
    throw new Error("Pricing tiers are required");
  }

  const sorted = [...tiers].sort((a, b) => a.minDays - b.minDays);
  let applicable = sorted[0];
  for (const tier of sorted) {
    if (tier.minDays <= days) {
      applicable = tier;
    } else {
      break;
    }
  }
  return applicable.pricePerDay;
}

/**
 * Computes the total number of billed days between two dates.
 * Any started day is billed (ceil).
 */
export function computeBilledDays(startDate: Date, endDate: Date): number {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
}

/**
 * Computes a full price quote for a rental.
 *
 * @param startDate Start of rental
 * @param endDate End of rental
 * @param tiers Pricing tiers (preferred). If empty, falls back to `fallbackPricePerDay`.
 * @param fallbackPricePerDay Used when tiers are not provided. Optional.
 */
export function quotePrice(
  startDate: Date,
  endDate: Date,
  tiers: readonly PricingTier[] | undefined,
  fallbackPricePerDay?: number
): PriceQuote {
  const totalDays = computeBilledDays(startDate, endDate);

  let pricePerDay: number;
  if (tiers && tiers.length > 0) {
    pricePerDay = getApplicablePricePerDay(totalDays, tiers);
  } else if (fallbackPricePerDay !== undefined) {
    pricePerDay = fallbackPricePerDay;
  } else {
    throw new Error("Either pricingTiers or fallbackPricePerDay must be provided");
  }

  return {
    totalDays,
    pricePerDay,
    totalPrice: totalDays * pricePerDay,
  };
}
