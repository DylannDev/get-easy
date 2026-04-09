/**
 * PricingTier — volume-based pricing for a vehicle.
 * The tier with the highest `minDays` <= rental duration applies.
 */
export interface PricingTier {
  minDays: number;
  pricePerDay: number;
}
