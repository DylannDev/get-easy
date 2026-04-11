"use server";

import { createAdminClient } from "@/infrastructure/supabase/client";

const BUCKET = "rent-saas";
const FOLDER = "vehicles";

export async function listStorageImages(): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(FOLDER, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

  if (error || !data) return [];

  const {
    data: { publicUrl: baseUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(FOLDER);

  return data
    .filter((f) => f.name && !f.name.startsWith("."))
    .map((f) => `${baseUrl}/${f.name}`);
}
