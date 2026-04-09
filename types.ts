/**
 * Backwards-compatibility shim. Will be removed in Phase 5.
 * New code should import from `@/domain/<bounded-context>` directly.
 */
export type { Vehicle, BlockedPeriod, PricingTier } from "@/domain/vehicle";
export type { Agency, OpeningHours as AgencyHours } from "@/domain/agency";
export type { Organization } from "@/domain/organization";
