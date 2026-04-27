import type { Document } from "@/domain/document";

/** Port de numérotation : alloue un numéro de facture séquentiel par
 *  organisation et par année (ex. `2026-0042`). Implémentation côté infra. */
export interface InvoiceNumberAllocator {
  allocate(organizationId: string, year: number): Promise<string>;
}

/** Port de rendu PDF : produit un Buffer à partir des données structurées.
 *  L'implémentation importe `@react-pdf/renderer` dynamiquement pour ne pas
 *  polluer le bundle client. */
export interface InvoicePdfRenderer {
  render(data: InvoicePdfData): Promise<Buffer>;
}

/** Forme attendue par le renderer PDF — découplée de
 *  `lib/pdf/invoice-template.tsx` pour respecter la frontière application
 *  / framework PDF. */
export interface InvoicePdfData {
  invoiceNumber: string;
  issuedAt: Date;
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
  items: InvoiceItem[];
  totalTTC: number;
}

export interface InvoiceItem {
  label: string;
  quantity: number;
  unitPriceTTC: number;
  totalTTC: number;
}

export type GenerateInvoiceOutcome =
  | { kind: "created"; document: Document }
  | { kind: "regenerated"; document: Document }
  | { kind: "error"; message: string };
