import type { Database } from "../database.types";
import type { Agency } from "@/domain/agency";
import type { Vehicle } from "@/domain/vehicle";
import {
  toDomainVehicle,
  type VehicleRowWithRelations,
} from "./vehicle.mapper";

type AgencyRow = Database["public"]["Tables"]["agencies"]["Row"];

export interface AgencyRowWithVehicles extends AgencyRow {
  vehicles: VehicleRowWithRelations[];
}

/**
 * Maps a Supabase agency row to a domain `Agency`.
 * Pass the (optional) image URLs map keyed by vehicle id.
 */
export function toDomainAgency(
  row: AgencyRow,
  vehicles: Vehicle[] = []
): Agency {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    address: row.address,
    hours: {
      openTime: row.open_time,
      closeTime: row.close_time,
      interval: row.interval,
    },
    vehicles,
  };
}

/**
 * Convenience: maps an agency row that already carries vehicle children.
 */
export function toDomainAgencyWithVehicles(
  row: AgencyRowWithVehicles,
  imageUrls?: Record<string, string>
): Agency {
  return toDomainAgency(
    row,
    row.vehicles.map((v) => toDomainVehicle(v, imageUrls?.[v.id]))
  );
}
