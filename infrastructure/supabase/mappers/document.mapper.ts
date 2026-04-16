import type { Database } from "../database.types";
import type { Document, DocumentType } from "@/domain/document";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export function toDomainDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    agencyId: row.agency_id,
    bookingId: row.booking_id,
    type: row.type as DocumentType,
    filePath: row.file_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    size: Number(row.size),
    invoiceNumber:
      ((row as Record<string, unknown>).invoice_number as
        | string
        | null
        | undefined) ?? null,
    createdAt: row.created_at,
  };
}
