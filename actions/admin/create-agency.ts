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

  // Fetch the first agency of the same organization to seed the new one with:
  //  - rental_terms (same contract text usually)
  //  - legal identity fields (organization-wide)
  //  - logos (organization-wide)
  const { data: seed } = await supabase
    .from("agencies")
    .select(
      "rental_terms, legal_form, capital_social, rcs_city, rcs_number, siret, tva_intracom, logo_url, logo_dark_url, vat_enabled"
    )
    .eq("organization_id", session.organizationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const s = (seed ?? {}) as Record<string, unknown>;
  const rentalTermsSeed = (s.rental_terms as unknown) ?? null;

  await supabase.from("agencies").insert({
    organization_id: session.organizationId,
    name: input.name,
    address: input.address,
    city: input.city,
    open_time: "07:00",
    close_time: "22:00",
    interval: 30,
    rental_terms: rentalTermsSeed,
    rental_terms_updated_at: rentalTermsSeed ? new Date().toISOString() : null,
    legal_form: (s.legal_form as string | null | undefined) ?? null,
    capital_social: (s.capital_social as string | null | undefined) ?? null,
    rcs_city: (s.rcs_city as string | null | undefined) ?? null,
    rcs_number: (s.rcs_number as string | null | undefined) ?? null,
    siret: (s.siret as string | null | undefined) ?? null,
    tva_intracom: (s.tva_intracom as string | null | undefined) ?? null,
    logo_url: (s.logo_url as string | null | undefined) ?? null,
    logo_dark_url: (s.logo_dark_url as string | null | undefined) ?? null,
    vat_enabled: (s.vat_enabled as boolean | undefined) ?? false,
  });

  revalidatePath("/admin/infos-agence");
  revalidatePath("/admin/infos-organisation");
}
