import { createAdminClient } from "../client";
import { toDomainDocument } from "../mappers";
import type {
  CreateDocumentInput,
  Document,
  DocumentRepository,
} from "@/domain/document";

const BUCKET = "documents";
const DEFAULT_SIGNED_URL_TTL = 60 * 60; // 1h

/**
 * Slugifies a filename to keep Supabase Storage paths clean.
 * Preserves the extension, replaces spaces and exotic characters, lowercases.
 */
function safeFileName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const base = lastDot >= 0 ? name.slice(0, lastDot) : name;
  const ext = lastDot >= 0 ? name.slice(lastDot) : "";
  const slug = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${slug || "document"}${ext.toLowerCase()}`;
}

export const createSupabaseDocumentRepository = (): DocumentRepository => {
  const listByAgency = async (agencyId: string): Promise<Document[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(toDomainDocument);
  };

  const listByBooking = async (bookingId: string): Promise<Document[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(toDomainDocument);
  };

  const findById = async (id: string): Promise<Document | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return toDomainDocument(data);
  };

  const create = async (input: CreateDocumentInput): Promise<Document> => {
    const supabase = createAdminClient();

    let path = input.filePath;
    if (!path) {
      // Resolve the agency's organization so we can group files by organization
      // in Storage — easier to browse in the Supabase dashboard for multi-tenant
      // deployments.
      const { data: agencyRow } = await supabase
        .from("agencies")
        .select("organization_id")
        .eq("id", input.agencyId)
        .single();
      const organizationId =
        (agencyRow as { organization_id?: string } | null)?.organization_id ??
        "unknown";

      // Default storage path: <organizationId>/<agencyId>/<type>/<timestamp>-<slug>.<ext>
      const cleanName = safeFileName(input.fileName);
      path = `${organizationId}/${input.agencyId}/${input.type}/${Date.now()}-${cleanName}`;
    }

    // Upload the file first so that if it fails we never end up with an
    // orphan row in the documents table.
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, input.content as Buffer | Uint8Array | ArrayBuffer, {
        contentType: input.mimeType,
        upsert: input.upsert ?? false,
      });
    if (uploadError) {
      throw new Error(
        `Impossible de importer le fichier : ${uploadError.message}`,
      );
    }

    const size =
      input.content instanceof ArrayBuffer
        ? input.content.byteLength
        : (input.content as Buffer | Uint8Array).byteLength;

    const { data, error } = await supabase
      .from("documents")
      .insert({
        agency_id: input.agencyId,
        booking_id: input.bookingId ?? null,
        quote_id: input.quoteId ?? null,
        inspection_report_id: input.inspectionReportId ?? null,
        type: input.type,
        file_path: path,
        file_name: input.fileName,
        mime_type: input.mimeType,
        size,
        invoice_number: input.invoiceNumber ?? null,
        quote_number: input.quoteNumber ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      // Roll back the storage object to keep state consistent.
      await supabase.storage.from(BUCKET).remove([path]);
      throw new Error(
        `Impossible d'enregistrer le document : ${error?.message ?? "erreur inconnue"}`,
      );
    }
    return toDomainDocument(data);
  };

  const findInvoiceByBooking = async (
    bookingId: string,
  ): Promise<Document | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("type", "invoice")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return toDomainDocument(data);
  };

  const findQuoteDocumentByQuoteId = async (
    quoteId: string,
  ): Promise<Document | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("quote_id", quoteId)
      .eq("type", "quote")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return toDomainDocument(data);
  };

  const replaceContent = async (
    id: string,
    content: Buffer | Uint8Array | ArrayBuffer,
    mimeType: string,
  ): Promise<Document | null> => {
    const supabase = createAdminClient();
    const existing = await findById(id);
    if (!existing) return null;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(existing.filePath, content as Buffer | Uint8Array | ArrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });
    if (uploadError) {
      throw new Error(
        `Impossible de remplacer le fichier : ${uploadError.message}`,
      );
    }
    const size =
      content instanceof ArrayBuffer
        ? content.byteLength
        : (content as Buffer | Uint8Array).byteLength;
    const { data, error } = await supabase
      .from("documents")
      .update({ size, mime_type: mimeType })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) return null;
    return toDomainDocument(data);
  };

  const deleteDocument = async (id: string): Promise<void> => {
    const supabase = createAdminClient();
    const existing = await findById(id);
    if (!existing) return;
    await supabase.storage.from(BUCKET).remove([existing.filePath]);
    await supabase.from("documents").delete().eq("id", id);
  };

  const getSignedUrl = async (
    id: string,
    options?: { expiresInSeconds?: number; forceDownload?: boolean },
  ): Promise<string | null> => {
    const supabase = createAdminClient();
    const existing = await findById(id);
    if (!existing) return null;
    const expiresIn = options?.expiresInSeconds ?? DEFAULT_SIGNED_URL_TTL;
    // When forceDownload is true we pass the original filename so the
    // browser saves the file with a meaningful name. Otherwise we omit the
    // option → inline display (PDFs/images open in a new tab).
    const signedUrlOptions = options?.forceDownload
      ? { download: existing.fileName }
      : undefined;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(existing.filePath, expiresIn, signedUrlOptions);
    if (error || !data) return null;
    return data.signedUrl;
  };

  const downloadContent = async (id: string): Promise<Buffer | null> => {
    const supabase = createAdminClient();
    const existing = await findById(id);
    if (!existing) return null;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(existing.filePath);
    if (error || !data) return null;
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  };

  return {
    listByAgency,
    listByBooking,
    findById,
    findInvoiceByBooking,
    findQuoteDocumentByQuoteId,
    create,
    replaceContent,
    delete: deleteDocument,
    getSignedUrl,
    downloadContent,
  };
};
