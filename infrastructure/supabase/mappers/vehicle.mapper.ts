import type { Database } from "../database.types";
import type {
  Vehicle,
  BlockedPeriod,
  PricingTier,
} from "@/domain/vehicle";

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];
type BlockedPeriodRow = Database["public"]["Tables"]["blocked_periods"]["Row"];
type PricingTierRow = Database["public"]["Tables"]["pricing_tiers"]["Row"];

export interface VehicleRowWithRelations extends VehicleRow {
  blockedPeriods: BlockedPeriodRow[];
  pricingTiers: PricingTierRow[];
}

/**
 * Maps a Supabase vehicle row (with its blocked_periods and pricing_tiers
 * children) into a domain `Vehicle`.
 */
export function toDomainVehicle(
  row: VehicleRowWithRelations,
  imageUrl?: string
): Vehicle {
  return {
    id: row.id,
    agencyId: row.agency_id,
    brand: row.brand,
    model: row.model,
    color: row.color,
    pricePerDay: row.price_per_day,
    transmission: row.transmission as Vehicle["transmission"],
    fuelType: row.fuel_type as Vehicle["fuelType"],
    numberOfSeats: row.number_of_seats,
    numberOfDoors: row.number_of_doors,
    trunkSize: row.trunk_size,
    year: row.year,
    registrationPlate: row.registration_plate,
    quantity: row.quantity,
    img: imageUrl || row.img,
    blockedPeriods: row.blockedPeriods.map(
      (p): BlockedPeriod => ({ start: p.start, end: p.end })
    ),
    pricingTiers: row.pricingTiers.map(
      (t): PricingTier => ({
        minDays: t.min_days,
        pricePerDay: t.price_per_day,
      })
    ),
  };
}
