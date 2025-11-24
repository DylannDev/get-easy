import type { VehicleWithRelations, AgencyWithVehicles } from "./queries";
import type { Vehicle, Agency, PricingTier, BlockedPeriod } from "@/types";

/**
 * Mappe un véhicule Supabase vers le format attendu par les composants
 */
export function mapVehicleFromDB(
  dbVehicle: VehicleWithRelations,
  imageUrl?: string
): Vehicle {
  return {
    id: dbVehicle.id,
    brand: dbVehicle.brand,
    model: dbVehicle.model,
    color: dbVehicle.color,
    pricePerDay: dbVehicle.price_per_day,
    transmission: dbVehicle.transmission as "automatique" | "manuelle",
    fuelType: dbVehicle.fuel_type as
      | "essence"
      | "diesel"
      | "électrique"
      | "hybride",
    numberOfSeats: dbVehicle.number_of_seats,
    numberOfDoors: dbVehicle.number_of_doors,
    trunkSize: dbVehicle.trunk_size,
    year: dbVehicle.year,
    registrationPlate: dbVehicle.registration_plate,
    quantity: dbVehicle.quantity,
    img: imageUrl || dbVehicle.img,
    blockedPeriods: dbVehicle.blockedPeriods.map(
      (period): BlockedPeriod => ({
        start: period.start,
        end: period.end,
      })
    ),
    pricingTiers: dbVehicle.pricingTiers.map(
      (tier): PricingTier => ({
        minDays: tier.min_days,
        pricePerDay: tier.price_per_day,
      })
    ),
  };
}

/**
 * Mappe une agence Supabase vers le format attendu par les composants
 */
export function mapAgencyFromDB(
  dbAgency: AgencyWithVehicles,
  imageUrls?: Record<string, string>
): Agency {
  return {
    id: dbAgency.id,
    name: dbAgency.name,
    city: dbAgency.city,
    address: dbAgency.address,
    hours: {
      openTime: dbAgency.open_time,
      closeTime: dbAgency.close_time,
      interval: dbAgency.interval,
    },
    vehicles: dbAgency.vehicles.map((v) =>
      mapVehicleFromDB(v, imageUrls?.[v.id])
    ),
  };
}
