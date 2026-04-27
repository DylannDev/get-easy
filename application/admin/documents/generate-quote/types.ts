import type { Document } from "@/domain/document";

/** Port d'allocation de numéro de devis (séquentiel par organisation et par
 *  année, ex. `DEV-2026-007`). */
export interface QuoteNumberAllocator {
  allocate(organizationId: string, year: number): Promise<string>;
}

export interface QuotePdfRenderer {
  render(data: QuotePdfData): Promise<Buffer>;
}

/** Forme attendue par le renderer PDF — découplée de
 *  `lib/pdf/quote-template.tsx` pour respecter la frontière application
 *  / framework PDF. */
export interface QuotePdfData {
  quoteNumber: string;
  issuedAt: Date;
  validUntil: Date;
  agency: {
    name: string;
    address: string;
    city: string;
    postalCode?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    legalForm?: string | null;
    capitalSocial?: string | null;
    rcsCity?: string | null;
    rcsNumber?: string | null;
    siret?: string | null;
    tvaIntracom?: string | null;
    logoUrl?: string | null;
    vatEnabled: boolean;
    rib?: string | null;
    showRibOnQuote?: boolean;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    companyName?: string | null;
    siret?: string | null;
    vatNumber?: string | null;
  };
  vehicle: { brand: string; model: string; registrationPlate: string };
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  pricePerDay: number;
  items: QuoteItem[];
  totalTTC: number;
}

export interface QuoteItem {
  label: string;
  quantity: number;
  unitPriceTTC: number;
  totalTTC: number;
}

export type GenerateQuoteOutcome =
  | { kind: "created"; document: Document }
  | { kind: "regenerated"; document: Document }
  | { kind: "error"; message: string };
