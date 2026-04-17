import type { Database } from "../database.types";
import type {
  CustomerDocument,
  CustomerDocumentType,
} from "@/domain/customer-document";

type Row = Database["public"]["Tables"]["customer_documents"]["Row"];

export function toDomainCustomerDocument(row: Row): CustomerDocument {
  return {
    id: row.id,
    customerId: row.customer_id,
    bookingId: row.booking_id,
    type: row.type as CustomerDocumentType,
    filePath: row.file_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    size: Number(row.size),
    createdAt: row.created_at,
  };
}
