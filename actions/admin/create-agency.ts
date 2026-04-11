"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/infrastructure/supabase/client";
import { getAdminSession } from "@/lib/admin/get-admin-session";

export async function createAgency(input: {
  name: string;
  address: string;
  city: string;
}) {
  const session = await getAdminSession();
  if (!session) throw new Error("Non autorisé");

  const supabase = createAdminClient();
  await supabase.from("agencies").insert({
    organization_id: session.organizationId,
    name: input.name,
    address: input.address,
    city: input.city,
    open_time: "07:00",
    close_time: "22:00",
    interval: 30,
  });

  revalidatePath("/admin/infos-agence");
}
