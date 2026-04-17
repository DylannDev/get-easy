import type { Document, DocumentType } from "./document.entity";

export interface CreateDocumentInput {
  agencyId: string;
  bookingId?: string | null;
  quoteId?: string | null;
  inspectionReportId?: string | null;
  type: DocumentType;
  /** Buffer/bytes of the file to upload to Storage. */
  content: Buffer | Uint8Array | ArrayBuffer;
  fileName: string;
  mimeType: string;
  invoiceNumber?: string | null;
  quoteNumber?: string | null;
  /**
   * Optional override of the default storage path so invoice regenerations
   * can reuse the same path and overwrite the previous file.
   */
  filePath?: string;
  /** When TRUE, an upload at `filePath` replaces an existing object. */
  upsert?: boolean;
}

export interface DocumentRepository {
  listByAgency(agencyId: string): Promise<Document[]>;
  listByBooking(bookingId: string): Promise<Document[]>;
  findById(id: string): Promise<Document | null>;
  /** Renvoie la facture associée à une réservation, si elle existe. */
  findInvoiceByBooking(bookingId: string): Promise<Document | null>;
  /** Renvoie le document de devis associé à un `quote_id`. */
  findQuoteDocumentByQuoteId(quoteId: string): Promise<Document | null>;
  /** Remplace le contenu binaire d'un document existant (même path). */
  replaceContent(
    id: string,
    content: Buffer | Uint8Array | ArrayBuffer,
    mimeType: string
  ): Promise<Document | null>;
  /**
   * Uploads the file to Storage then creates the DB row pointing at it.
   * Returns the created Document.
   */
  create(input: CreateDocumentInput): Promise<Document>;
  /**
   * Removes the Storage object then the DB row.
   */
  delete(id: string): Promise<void>;
  /**
   * Returns a short-lived signed URL (~1h) to access the underlying file.
   *
   * `forceDownload = true` → sets Content-Disposition: attachment so the
   *   browser saves the file instead of rendering it inline.
   */
  getSignedUrl(
    id: string,
    options?: { expiresInSeconds?: number; forceDownload?: boolean }
  ): Promise<string | null>;
}
