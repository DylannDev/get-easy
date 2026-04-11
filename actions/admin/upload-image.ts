"use server";

import { createAdminClient } from "@/infrastructure/supabase/client";

const MAX_SIZE = 2 * 1024 * 1024; // 2 Mo
const BUCKET = "rent-saas";

export async function uploadVehicleImage(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get("file") as File | null;
  if (!file) return { url: null, error: "Aucun fichier sélectionné" };

  if (file.size > MAX_SIZE) {
    return { url: null, error: "L'image ne doit pas dépasser 2 Mo" };
  }

  if (!file.type.startsWith("image/")) {
    return { url: null, error: "Le fichier doit être une image" };
  }

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `vehicles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) {
    return { url: null, error: `Erreur d'upload : ${error.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  return { url: publicUrl, error: null };
}
