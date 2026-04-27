"use server";

import { createAdminClient } from "@/infrastructure/supabase/client";
import { compressFile } from "@/lib/compression/compress-file";

const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
const BUCKET = "rent-saas";

export async function uploadVehicleImage(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get("file") as File | null;
  if (!file) return { url: null, error: "Aucun fichier sélectionné" };

  if (file.size > MAX_SIZE) {
    return { url: null, error: "L'image ne doit pas dépasser 10 Mo" };
  }

  if (!file.type.startsWith("image/")) {
    return { url: null, error: "Le fichier doit être une image" };
  }

  try {
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const compressed = await compressFile(rawBuffer, file.type, {
      image: { maxWidth: 1000, maxHeight: 1000, quality: 85 },
    });

    const supabase = createAdminClient();
    const ext =
      compressed.mimeType === "image/png"
        ? "png"
        : compressed.mimeType === "image/webp"
          ? "webp"
          : "jpg";
    const fileName = `vehicles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, compressed.buffer as Buffer, {
        contentType: compressed.mimeType,
        upsert: false,
      });

    if (error) {
      return { url: null, error: `Erreur d'upload : ${error.message}` };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

    return { url: publicUrl, error: null };
  } catch (e) {
    console.error("[uploadVehicleImage] compression error:", e);
    return {
      url: null,
      error: "Impossible de traiter cette image. Essayez un autre format (JPG, PNG).",
    };
  }
}
