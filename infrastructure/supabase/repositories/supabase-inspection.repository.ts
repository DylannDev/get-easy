import { createAdminClient } from "../client";
import {
  toDomainInspectionReport,
  toDomainInspectionPhoto,
} from "../mappers";
import type {
  AddInspectionPhotoInput,
  InspectionPhoto,
  InspectionReport,
  InspectionRepository,
  InspectionType,
  SignInspectionReportInput,
  UpdateInspectionPhotoInput,
  UpsertInspectionReportInput,
} from "@/domain/inspection";

const BUCKET = "documents";
const SIGNED_URL_TTL = 60 * 60; // 1h

export const createSupabaseInspectionRepository =
  (): InspectionRepository => {
    const findByBookingAndType = async (
      bookingId: string,
      type: InspectionType
    ): Promise<InspectionReport | null> => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("inspection_reports")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("type", type)
        .maybeSingle();
      if (error || !data) return null;
      return toDomainInspectionReport(data);
    };

    const findById = async (id: string): Promise<InspectionReport | null> => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("inspection_reports")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return null;
      return toDomainInspectionReport(data);
    };

    const upsert = async (
      input: UpsertInspectionReportInput
    ): Promise<InspectionReport> => {
      const supabase = createAdminClient();

      // Cherche l'existant pour décider insert vs update.
      const existing = await findByBookingAndType(input.bookingId, input.type);
      if (existing) {
        const { data, error } = await supabase
          .from("inspection_reports")
          .update({
            mileage: input.mileage ?? null,
            fuel_level: input.fuelLevel ?? null,
            notes: input.notes ?? null,
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (error || !data) {
          throw new Error(
            `Impossible de mettre à jour le rapport : ${error?.message ?? "erreur inconnue"}`
          );
        }
        return toDomainInspectionReport(data);
      }

      const { data, error } = await supabase
        .from("inspection_reports")
        .insert({
          booking_id: input.bookingId,
          type: input.type,
          mileage: input.mileage ?? null,
          fuel_level: input.fuelLevel ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error || !data) {
        throw new Error(
          `Impossible de créer le rapport : ${error?.message ?? "erreur inconnue"}`
        );
      }
      return toDomainInspectionReport(data);
    };

    const sign = async (
      input: SignInspectionReportInput
    ): Promise<InspectionReport> => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("inspection_reports")
        .update({
          customer_signature: input.customerSignature,
          signed_at: new Date().toISOString(),
        })
        .eq("id", input.reportId)
        .select()
        .single();
      if (error || !data) {
        throw new Error(
          `Impossible de signer le rapport : ${error?.message ?? "erreur inconnue"}`
        );
      }
      return toDomainInspectionReport(data);
    };

    const listPhotos = async (
      reportId: string
    ): Promise<InspectionPhoto[]> => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("inspection_photos")
        .select("*")
        .eq("report_id", reportId)
        .order("sort_order", { ascending: true });
      if (error || !data) return [];
      return data.map(toDomainInspectionPhoto);
    };

    const addPhoto = async (
      input: AddInspectionPhotoInput
    ): Promise<InspectionPhoto> => {
      const supabase = createAdminClient();

      // Upload vers Storage d'abord.
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(
          input.filePath,
          input.content as Buffer | Uint8Array | ArrayBuffer,
          {
            contentType: input.mimeType,
            upsert: false,
          }
        );
      if (uploadError) {
        throw new Error(
          `Échec de l'upload photo : ${uploadError.message}`
        );
      }

      const size =
        input.content instanceof ArrayBuffer
          ? input.content.byteLength
          : (input.content as Buffer | Uint8Array).byteLength;

      const { data, error } = await supabase
        .from("inspection_photos")
        .insert({
          report_id: input.reportId,
          file_path: input.filePath,
          file_name: input.fileName,
          mime_type: input.mimeType,
          size,
          note: input.note ?? null,
          sort_order: input.sortOrder,
        })
        .select()
        .single();
      if (error || !data) {
        // Rollback storage.
        await supabase.storage.from(BUCKET).remove([input.filePath]);
        throw new Error(
          `Impossible d'enregistrer la photo : ${error?.message ?? "erreur inconnue"}`
        );
      }
      return toDomainInspectionPhoto(data);
    };

    const updatePhoto = async (
      photoId: string,
      input: UpdateInspectionPhotoInput
    ): Promise<InspectionPhoto | null> => {
      const supabase = createAdminClient();
      const updatePayload: Record<string, unknown> = {};
      if (input.note !== undefined) updatePayload.note = input.note;
      if (input.sortOrder !== undefined)
        updatePayload.sort_order = input.sortOrder;
      if (Object.keys(updatePayload).length === 0) return null;
      const { data, error } = await supabase
        .from("inspection_photos")
        .update(updatePayload)
        .eq("id", photoId)
        .select()
        .single();
      if (error || !data) return null;
      return toDomainInspectionPhoto(data);
    };

    const deletePhoto = async (photoId: string): Promise<void> => {
      const supabase = createAdminClient();
      // Récupère le path pour supprimer du Storage.
      const { data: row } = await supabase
        .from("inspection_photos")
        .select("file_path")
        .eq("id", photoId)
        .maybeSingle();
      if (row) {
        await supabase.storage
          .from(BUCKET)
          .remove([(row as { file_path: string }).file_path]);
      }
      await supabase.from("inspection_photos").delete().eq("id", photoId);
    };

    const getPhotoSignedUrl = async (
      photoId: string
    ): Promise<string | null> => {
      const supabase = createAdminClient();
      const { data: row } = await supabase
        .from("inspection_photos")
        .select("file_path")
        .eq("id", photoId)
        .maybeSingle();
      if (!row) return null;
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(
          (row as { file_path: string }).file_path,
          SIGNED_URL_TTL
        );
      if (error || !data) return null;
      return data.signedUrl;
    };

    return {
      findByBookingAndType,
      findById,
      upsert,
      sign,
      listPhotos,
      addPhoto,
      updatePhoto,
      deletePhoto,
      getPhotoSignedUrl,
    };
  };
