import { createAdminClient } from "../client";
import { toDomainAgency } from "../mappers";
import type { Agency, AgencyRepository } from "@/domain/agency";

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

  return { findById, findAll };
};
