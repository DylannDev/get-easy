"use server";

import { createAuthServerClient } from "@/infrastructure/supabase/auth";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
