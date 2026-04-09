import type { BlockedPeriod } from "./blocked-period.vo";
import type { PricingTier } from "./pricing-tier.vo";

export interface Vehicle {
  id: string;
  agencyId: string;
  brand: string;
  model: string;
  /** @deprecated kept for backwards compatibility — use pricingTiers */
  pricePerDay: number;
  pricingTiers: PricingTier[];
  numberOfSeats: number;
  numberOfDoors: number;
  trunkSize: string;
  transmission: "automatique" | "manuelle";
  fuelType: "essence" | "diesel" | "électrique" | "hybride";
  color: string;
  quantity: number;
  img: string;
  year: number;
  registrationPlate: string;
  blockedPeriods: BlockedPeriod[];
}
