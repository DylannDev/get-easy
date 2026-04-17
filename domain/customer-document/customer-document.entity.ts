export type CustomerDocumentType =
  | "driver_license"
  | "id_card"
  | "proof_of_address";

export interface CustomerDocument {
  id: string;
  customerId: string;
  bookingId: string | null;
  type: CustomerDocumentType;
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export const CUSTOMER_DOCUMENT_TYPE_LABELS: Record<
  CustomerDocumentType,
  string
> = {
  driver_license: "Permis de conduire",
  id_card: "Pièce d'identité",
  proof_of_address: "Justificatif de domicile",
};
