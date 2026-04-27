import { createAdminClient } from "../client";
import { toDomainQuote, toDomainQuoteOption } from "../mappers";
import type {
  AttachOptionToQuoteInput,
  CreateQuoteInput,
  Quote,
  QuoteOption,
  QuoteRepository,
} from "@/domain/quote";

export const createSupabaseQuoteRepository = (): QuoteRepository => {
  const findById = async (id: string): Promise<Quote | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return toDomainQuote(data);
  };

  const listByAgency = async (agencyId: string): Promise<Quote[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(toDomainQuote);
  };

  const create = async (input: CreateQuoteInput): Promise<Quote> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        agency_id: input.agencyId,
        customer_id: input.customerId,
        vehicle_id: input.vehicleId,
        start_date: input.startDate,
        end_date: input.endDate,
        base_price: input.basePrice,
        options_total: input.optionsTotal,
        cgl_total: input.cglTotal,
        total_price: input.totalPrice,
        valid_until: input.validUntil,
        created_by: input.createdBy ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      throw new Error(
        `Impossible de créer le devis : ${error?.message ?? "erreur inconnue"}`
      );
    }
    return toDomainQuote(data);
  };

  const listOptionsForQuote = async (
    quoteId: string
  ): Promise<QuoteOption[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("quote_options")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map(toDomainQuoteOption);
  };

  const attachOption = async (
    input: AttachOptionToQuoteInput
  ): Promise<QuoteOption> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("quote_options")
      .insert({
        quote_id: input.quoteId,
        option_id: input.optionId,
        quantity: input.quantity,
        unit_price_snapshot: input.unitPriceSnapshot,
        price_type_snapshot: input.priceTypeSnapshot,
        name_snapshot: input.nameSnapshot,
        monthly_cap_snapshot: input.monthlyCapSnapshot,
      })
      .select()
      .single();
    if (error || !data) {
      throw new Error(
        `Impossible d'attacher l'option au devis : ${error?.message ?? "erreur inconnue"}`
      );
    }
    return toDomainQuoteOption(data);
  };

  const listByCustomerId: QuoteRepository["listByCustomerId"] = async (
    customerId
  ) => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(toDomainQuote);
  };

  const deleteQuote: QuoteRepository["delete"] = async (quoteId) => {
    const supabase = createAdminClient();
    const { error } = await supabase.from("quotes").delete().eq("id", quoteId);
    if (error) {
      throw new Error(`Impossible de supprimer le devis : ${error.message}`);
    }
  };

  return {
    findById,
    listByAgency,
    listByCustomerId,
    create,
    delete: deleteQuote,
    listOptionsForQuote,
    attachOption,
  };
};
