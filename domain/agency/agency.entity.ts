import type { Vehicle } from "../vehicle/vehicle.entity";
import type { OpeningHours } from "./opening-hours.vo";

export interface TimeSlot {
  openTime: string;
  closeTime: string;
}

export interface DaySchedule {
  enabled: boolean;
  /** @deprecated Use slots instead */
  openTime: string;
  /** @deprecated Use slots instead */
  closeTime: string;
  slots?: TimeSlot[];
}

export interface WeekSchedule {
  allDays: boolean;
  days: Record<string, DaySchedule>;
}

/**
 * Tiptap JSON document. We intentionally keep the type loose (`unknown`) at
 * the domain level — the specific shape belongs to the Tiptap schema, not to
 * the domain. UI components pass it to Tiptap and get a typed tree back.
 */
export type RichTextDocument = Record<string, unknown>;

export interface Agency {
  id: string;
  organizationId?: string;
  name: string;
  city: string;
  address: string;
  postalCode?: string | null;
  country?: string | null;
  hours: OpeningHours;
  phone?: string;
  email?: string;
  deliveryLabel?: string;
  deliveryZones?: string;
  schedule?: WeekSchedule;
  rentalTerms?: RichTextDocument | null;
  rentalTermsUpdatedAt?: string | null;
  /** Mentions légales affichées sur factures et contrats. */
  legalForm?: string | null;
  capitalSocial?: string | null;
  rcsCity?: string | null;
  rcsNumber?: string | null;
  siret?: string | null;
  tvaIntracom?: string | null;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  /** TRUE si l'organisation est assujettie à la TVA (taux 20%). */
  vatEnabled?: boolean;
  /** Data URL PNG — signature ou tampon par défaut du Loueur, per-agence. */
  defaultLoueurSignature?: string | null;
  vehicles: Vehicle[];
}
