import { createAdminClient } from "../client";
import { toDomainCustomerDocument } from "../mappers";
import type {
  CustomerDocument,
  CustomerDocumentRepository,
  UpsertCustomerDocumentInput,
} from "@/domain/customer-document";

const BUCKET = "customer-documents";
const DEFAULT_SIGNED_URL_TTL = 60 * 60; // 1 h

function extFromMime(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export const createSupabaseCustomerDocumentRepository =
  (): CustomerDocumentRepository => {
    const listByCustomer = async (
      customerId: string
    ): Promise<CustomerDocument[]> => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("customer_documents")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error || !data) return [];
      return data.map(toDomainCustomerDocument);
    };

    const listByBooking = async (
      bookingId: string
    ): Promise<CustomerDocument[]> => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("customer_documents")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false });
      if (error || !data) return [];
      return data.map(toDomainCustomerDocument);
    };

    const findById = async (id: string): Promise<CustomerDocument | null> => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("customer_documents")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) return null;
      return toDomainCustomerDocument(data);
    };

    const upsert = async (
      input: UpsertCustomerDocumentInput
    ): Promise<CustomerDocument> => {
      const supabase = createAdminClient();
      const ext = extFromMime(input.mimeType);
      const path = `${input.organizationId}/${input.customerId}/${input.type}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, input.content as Buffer | Uint8Array | ArrayBuffer, {
          contentType: input.mimeType,
          upsert: false,
        });
      if (uploadError) {
        throw new Error(
          `Échec du téléversement : ${uploadError.message}`
        );
      }

      // Supprime l'éventuel fichier précédent pour le même (customer, type).
      const { data: existing } = await supabase
        .from("customer_documents")
        .select("id, file_path")
        .eq("customer_id", input.customerId)
        .eq("type", input.type)
        .maybeSingle();
      if (existing?.file_path) {
        await supabase.storage
          .from(BUCKET)
          .remove([existing.file_path as string]);
      }
      if (existing?.id) {
        await supabase
          .from("customer_documents")
          .delete()
          .eq("id", existing.id);
      }

      const size =
        input.content instanceof ArrayBuffer
          ? input.content.byteLength
          : (input.content as Buffer | Uint8Array).byteLength;

      const { data, error } = await supabase
        .from("customer_documents")
        .insert({
          customer_id: input.customerId,
          booking_id: input.bookingId ?? null,
          type: input.type,
          file_path: path,
          file_name: input.fileName,
          mime_type: input.mimeType,
          size,
        })
        .select()
        .single();
      if (error || !data) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw new Error(
          `Impossible d'enregistrer le document : ${error?.message ?? "inconnu"}`
        );
      }
      return toDomainCustomerDocument(data);
    };

    const finalizeFromStaging: CustomerDocumentRepository["finalizeFromStaging"] =
      async (input) => {
        const supabase = createAdminClient();
        const stagingPath = `staging/${input.stagingKey}`;
        const ext = extFromMime(input.mimeType);
        // Suffixe aléatoire en plus du timestamp pour permettre plusieurs
        // fichiers du même `(customer,type)` dans la même milliseconde
        // (ex. import recto + verso en parallèle).
        const rand = Math.random().toString(36).slice(2, 8);
        const finalPath = `${input.organizationId}/${input.customerId}/${input.type}-${Date.now()}-${rand}.${ext}`;

        // Multi-fichiers par type autorisé (recto + verso, etc.) → on n'écrase
        // plus l'éventuel doc existant. La suppression manuelle se fait via
        // l'UI (bouton corbeille par doc).

        // Déplace le fichier staging vers son emplacement final.
        const { error: moveError } = await supabase.storage
          .from(BUCKET)
          .move(stagingPath, finalPath);
        if (moveError) {
          throw new Error(
            `Impossible de finaliser le document : ${moveError.message}`
          );
        }

        const { data, error } = await supabase
          .from("customer_documents")
          .insert({
            customer_id: input.customerId,
            booking_id: input.bookingId,
            type: input.type,
            file_path: finalPath,
            file_name: input.fileName,
            mime_type: input.mimeType,
            size: input.size,
          })
          .select()
          .single();
        if (error || !data) {
          // Rollback storage
          await supabase.storage.from(BUCKET).remove([finalPath]);
          throw new Error(
            `Impossible d'enregistrer le document : ${error?.message ?? "inconnu"}`
          );
        }
        return toDomainCustomerDocument(data);
      };

    const deleteDoc = async (id: string): Promise<void> => {
      const supabase = createAdminClient();
      const existing = await findById(id);
      if (!existing) return;
      await supabase.storage.from(BUCKET).remove([existing.filePath]);
      await supabase.from("customer_documents").delete().eq("id", id);
    };

    const getSignedUrl = async (
      id: string,
      options?: { forceDownload?: boolean; expiresInSeconds?: number }
    ): Promise<string | null> => {
      const supabase = createAdminClient();
      const existing = await findById(id);
      if (!existing) return null;
      const expiresIn = options?.expiresInSeconds ?? DEFAULT_SIGNED_URL_TTL;
      const opts = options?.forceDownload
        ? { download: existing.fileName }
        : undefined;
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(existing.filePath, expiresIn, opts);
      if (error || !data) return null;
      return data.signedUrl;
    };

    return {
      listByCustomer,
      listByBooking,
      findById,
      upsert,
      finalizeFromStaging,
      delete: deleteDoc,
      getSignedUrl,
    };
  };
