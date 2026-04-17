export type DocumentType = "invoice" | "contract" | "other" | "quote" | "inspection";

export interface Document {
  id: string;
  agencyId: string;
  bookingId: string | null;
  /** Référence au devis associé (uniquement pour les documents de type `quote`). */
  quoteId: string | null;
  /** Référence au rapport d'inspection (type `inspection`). */
  inspectionReportId: string | null;
  type: DocumentType;
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
  /** Numéro formaté "FAC-2026-001" attribué aux documents de type `invoice`. */
  invoiceNumber: string | null;
  /** Numéro formaté "DEV-2026-001" attribué aux documents de type `quote`. */
  quoteNumber: string | null;
  createdAt: string;
}
