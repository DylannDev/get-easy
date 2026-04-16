import { createAdminClient } from "../client";
import { toDomainAgency } from "../mappers";
import type {
  Agency,
  AgencyRepository,
  RichTextDocument,
  UpdateAgencyLegalInput,
} from "@/domain/agency";

export const createSupabaseAgencyRepository = (): AgencyRepository => {
  const findById = async (agencyId: string): Promise<Agency | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("agencies")
      .select("*")
      .eq("id", agencyId)
      .single();
    if (error || !data) return null;
    return toDomainAgency(data);
  };

  const findAll = async (): Promise<Agency[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("agencies")
      .select("*")
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map((row) => toDomainAgency(row));
  };

  const updateRentalTerms = async (
    agencyId: string,
    rentalTerms: RichTextDocument | null
  ): Promise<void> => {
    const supabase = createAdminClient();
    await supabase
      .from("agencies")
      .update({
        rental_terms: rentalTerms,
        rental_terms_updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId);
  };

  const updateLegalDetails = async (
    agencyId: string,
    input: UpdateAgencyLegalInput
  ): Promise<void> => {
    const supabase = createAdminClient();
    const patch: Record<string, unknown> = {};
    if (input.legalForm !== undefined) patch.legal_form = input.legalForm;
    if (input.capitalSocial !== undefined)
      patch.capital_social = input.capitalSocial;
    if (input.rcsCity !== undefined) patch.rcs_city = input.rcsCity;
    if (input.rcsNumber !== undefined) patch.rcs_number = input.rcsNumber;
    if (input.siret !== undefined) patch.siret = input.siret;
    if (input.tvaIntracom !== undefined) patch.tva_intracom = input.tvaIntracom;
    if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;
    if (input.logoDarkUrl !== undefined) patch.logo_dark_url = input.logoDarkUrl;
    if (input.vatEnabled !== undefined) patch.vat_enabled = input.vatEnabled;
    await supabase.from("agencies").update(patch).eq("id", agencyId);
  };

  return { findById, findAll, updateRentalTerms, updateLegalDetails };
};
