import { createAdminClient } from "../client";
import { toDomainBooking } from "../mappers";
import type {
  Booking,
  BookingRepository,
  BookingStatus,
  CreateBookingInput,
  UpdateBookingInput,
} from "@/domain/booking";
import type { BookingAvailabilityView } from "@/domain/vehicle";

const ACTIVE_STATUSES = ["paid", "pending_payment"] as const;

export const createSupabaseBookingRepository = (): BookingRepository => {
  const findById = async (bookingId: string): Promise<Booking | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();
    if (error || !data) return null;
    return toDomainBooking(data);
  };

  const findActiveAvailabilityViewsByVehicleId = async (
    vehicleId: string
  ): Promise<BookingAvailabilityView[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("id, start_date, end_date, status")
      .eq("vehicle_id", vehicleId)
      .in("status", ACTIVE_STATUSES as unknown as string[])
      .gte("end_date", new Date().toISOString());
    if (error || !data) return [];
    return data;
  };

  const findActiveAvailabilityViewsByVehicleIds = async (
    vehicleIds: string[]
  ): Promise<Map<string, BookingAvailabilityView[]>> => {
    const result = new Map<string, BookingAvailabilityView[]>();
    if (vehicleIds.length === 0) return result;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("id, vehicle_id, start_date, end_date, status")
      .in("vehicle_id", vehicleIds)
      .in("status", ACTIVE_STATUSES as unknown as string[])
      .gte("end_date", new Date().toISOString());
    if (error || !data) return result;

    for (const row of data) {
      const list = result.get(row.vehicle_id) ?? [];
      list.push({
        id: row.id,
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
      });
      result.set(row.vehicle_id, list);
    }
    return result;
  };

  const findPaidConflicts = async (args: {
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    excludeBookingId: string;
  }): Promise<BookingAvailabilityView[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("id, start_date, end_date, status")
      .eq("vehicle_id", args.vehicleId)
      .eq("status", "paid")
      .neq("id", args.excludeBookingId)
      .gte("end_date", args.startDate.toISOString());
    if (error || !data) return [];
    return data;
  };

  const create = async (input: CreateBookingInput): Promise<Booking> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: input.customerId ?? null,
        vehicle_id: input.vehicleId,
        agency_id: input.agencyId,
        start_date: input.startDate,
        end_date: input.endDate,
        total_price: input.totalPrice,
        status: input.status,
        expires_at: input.expiresAt ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to create booking: ${error?.message ?? "unknown error"}`
      );
    }
    return toDomainBooking(data);
  };

  const update = async (
    bookingId: string,
    input: UpdateBookingInput,
    options: { expectedStatuses?: BookingStatus[] } = {}
  ): Promise<Booking | null> => {
    const supabase = createAdminClient();

    const patch: Record<string, unknown> = {};
    if (input.customerId !== undefined) patch.customer_id = input.customerId;
    if (input.vehicleId !== undefined) patch.vehicle_id = input.vehicleId;
    if (input.agencyId !== undefined) patch.agency_id = input.agencyId;
    if (input.startDate !== undefined) patch.start_date = input.startDate;
    if (input.endDate !== undefined) patch.end_date = input.endDate;
    if (input.totalPrice !== undefined) patch.total_price = input.totalPrice;
    if (input.status !== undefined) patch.status = input.status;
    if (input.expiresAt !== undefined) patch.expires_at = input.expiresAt;

    let query = supabase.from("bookings").update(patch).eq("id", bookingId);
    if (options.expectedStatuses && options.expectedStatuses.length > 0) {
      query = query.in("status", options.expectedStatuses);
    }

    const { data, error } = await query.select().single();
    if (error || !data) return null;
    return toDomainBooking(data);
  };

  return {
    findById,
    findActiveAvailabilityViewsByVehicleId,
    findActiveAvailabilityViewsByVehicleIds,
    findPaidConflicts,
    create,
    update,
  };
};
