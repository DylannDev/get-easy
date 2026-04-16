export type DocumentType = "invoice" | "contract" | "other";

export interface Document {
  id: string;
  agencyId: string;
  bookingId: string | null;
  type: DocumentType;
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
  /** Numéro formaté "FAC-2026-001" attribué aux documents de type `invoice`. */
  invoiceNumber: string | null;
  createdAt: string;
}
