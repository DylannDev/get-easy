import { createAdminClient } from "../client";
import { toDomainOption, toDomainBookingOption } from "../mappers";
import type {
  Option,
  BookingOption,
  OptionRepository,
  CreateOptionInput,
  UpdateOptionInput,
  AttachOptionToBookingInput,
} from "@/domain/option";

export const createSupabaseOptionRepository = (): OptionRepository => {
  const listByAgency = async (agencyId: string): Promise<Option[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("options")
      .select("*")
      .eq("agency_id", agencyId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map(toDomainOption);
  };

  const listActiveByAgency = async (agencyId: string): Promise<Option[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("options")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map(toDomainOption);
  };

  const findById = async (id: string): Promise<Option | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("options")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return toDomainOption(data);
  };

  const create = async (input: CreateOptionInput): Promise<Option> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("options")
      .insert({
        agency_id: input.agencyId,
        name: input.name,
        description: input.description ?? null,
        price_type: input.priceType,
        price: input.price,
        max_quantity: input.maxQuantity,
        active: input.active ?? true,
        sort_order: input.sortOrder ?? 0,
        cap_enabled: input.capEnabled ?? false,
        monthly_cap: input.monthlyCap ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      throw new Error(`Failed to create option: ${error?.message ?? "unknown"}`);
    }
    return toDomainOption(data);
  };

  const update = async (
    id: string,
    input: UpdateOptionInput
  ): Promise<Option | null> => {
    const supabase = createAdminClient();
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.priceType !== undefined) patch.price_type = input.priceType;
    if (input.price !== undefined) patch.price = input.price;
    if (input.maxQuantity !== undefined) patch.max_quantity = input.maxQuantity;
    if (input.active !== undefined) patch.active = input.active;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
    if (input.capEnabled !== undefined) patch.cap_enabled = input.capEnabled;
    if (input.monthlyCap !== undefined) patch.monthly_cap = input.monthlyCap;

    const { data, error } = await supabase
      .from("options")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) return null;
    return toDomainOption(data);
  };

  const deleteOption = async (id: string): Promise<void> => {
    const supabase = createAdminClient();
    await supabase.from("options").delete().eq("id", id);
  };

  const listForBooking = async (bookingId: string): Promise<BookingOption[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("booking_options")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map(toDomainBookingOption);
  };

  const attachToBooking = async (
    input: AttachOptionToBookingInput
  ): Promise<BookingOption> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("booking_options")
      .insert({
        booking_id: input.bookingId,
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
        `Failed to attach option to booking: ${error?.message ?? "unknown"}`
      );
    }
    return toDomainBookingOption(data);
  };

  const detachAllFromBooking = async (bookingId: string): Promise<void> => {
    const supabase = createAdminClient();
    await supabase
      .from("booking_options")
      .delete()
      .eq("booking_id", bookingId);
  };

  return {
    listByAgency,
    listActiveByAgency,
    findById,
    create,
    update,
    delete: deleteOption,
    listForBooking,
    attachToBooking,
    detachAllFromBooking,
  };
};
