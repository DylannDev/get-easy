import type { Database } from "../database.types";
import type { Document, DocumentType } from "@/domain/document";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export function toDomainDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    agencyId: row.agency_id,
    bookingId: row.booking_id,
    quoteId: row.quote_id ?? null,
    inspectionReportId: row.inspection_report_id ?? null,
    type: row.type as DocumentType,
    filePath: row.file_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    size: Number(row.size),
    invoiceNumber: row.invoice_number ?? null,
    quoteNumber: row.quote_number ?? null,
    createdAt: row.created_at,
  };
}
