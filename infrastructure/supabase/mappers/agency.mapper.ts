import type { Database } from "../database.types";
import type { Agency, WeekSchedule, RichTextDocument } from "@/domain/agency";
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
    organizationId: row.organization_id,
    name: row.name,
    city: row.city,
    address: row.address,
    postalCode:
      ((row as Record<string, unknown>).postal_code as
        | string
        | null
        | undefined) ?? null,
    country:
      ((row as Record<string, unknown>).country as
        | string
        | null
        | undefined) ?? null,
    hours: {
      openTime: row.open_time,
      closeTime: row.close_time,
      interval: row.interval,
    },
    phone: (row as Record<string, unknown>).phone as string | undefined,
    email: (row as Record<string, unknown>).email as string | undefined,
    deliveryLabel: (row as Record<string, unknown>).delivery_label as string | undefined,
    deliveryZones: (row as Record<string, unknown>).delivery_zones as string | undefined,
    schedule: (row as Record<string, unknown>).schedule as WeekSchedule | undefined,
    rentalTerms:
      ((row as Record<string, unknown>).rental_terms as
        | RichTextDocument
        | null
        | undefined) ?? null,
    rentalTermsUpdatedAt:
      ((row as Record<string, unknown>).rental_terms_updated_at as
        | string
        | null
        | undefined) ?? null,
    legalForm: (row.legal_form as string | null | undefined) ?? null,
    capitalSocial: (row.capital_social as string | null | undefined) ?? null,
    rcsCity: (row.rcs_city as string | null | undefined) ?? null,
    rcsNumber: (row.rcs_number as string | null | undefined) ?? null,
    siret: (row.siret as string | null | undefined) ?? null,
    tvaIntracom: (row.tva_intracom as string | null | undefined) ?? null,
    logoUrl: (row.logo_url as string | null | undefined) ?? null,
    logoDarkUrl:
      ((row as Record<string, unknown>).logo_dark_url as
        | string
        | null
        | undefined) ?? null,
    vatEnabled:
      ((row as Record<string, unknown>).vat_enabled as
        | boolean
        | undefined) ?? false,
    defaultLoueurSignature:
      ((row as Record<string, unknown>).default_loueur_signature as
        | string
        | null
        | undefined) ?? null,
    quoteValidityDays: row.quote_validity_days ?? 30,
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
