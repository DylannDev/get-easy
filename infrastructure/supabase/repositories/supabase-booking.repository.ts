import { createAdminClient } from "../client";
import { toDomainBooking, toDomainBookingWithDetails } from "../mappers";
import type {
  Booking,
  BookingWithDetails,
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

  // ── Admin queries ─────────────────────────────────────────────

  const BOOKING_WITH_DETAILS_SELECT =
    "*, customers(first_name, last_name, email, phone), vehicles(brand, model, color)";

  const findAllWithDetails = async (params: {
    page: number;
    pageSize: number;
    agencyId?: string;
    statuses?: BookingStatus[];
    search?: string;
    startDate?: string;
    endDate?: string;
    sort?: { field: string; direction: "asc" | "desc" };
  }): Promise<{ data: BookingWithDetails[]; count: number }> => {
    const supabase = createAdminClient();
    const hasSearch = !!params.search;

    let query = supabase
      .from("bookings")
      .select(BOOKING_WITH_DETAILS_SELECT, { count: "exact" });

    if (params.agencyId) {
      query = query.eq("agency_id", params.agencyId);
    }
    if (params.statuses && params.statuses.length > 0) {
      query = query.in("status", params.statuses);
    }
    if (params.startDate) {
      query = query.gte("start_date", params.startDate);
    }
    if (params.endDate) {
      query = query.lte("end_date", params.endDate);
    }

    const sortField = params.sort?.field ?? "created_at";
    const sortDir = params.sort?.direction ?? "desc";
    query = query.order(sortField, { ascending: sortDir === "asc" });

    // When searching, fetch all rows so we can filter across joined fields,
    // then paginate in JS. Without search, paginate at DB level.
    if (!hasSearch) {
      const from = (params.page - 1) * params.pageSize;
      const to = from + params.pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error || !data) return { data: [], count: 0 };

    let results = data.map(toDomainBookingWithDetails);

    if (hasSearch) {
      const s = params.search!.toLowerCase();
      results = results.filter(
        (b) =>
          b.customerFirstName.toLowerCase().includes(s) ||
          b.customerLastName.toLowerCase().includes(s) ||
          b.customerEmail.toLowerCase().includes(s) ||
          b.id.toLowerCase().includes(s)
      );

      const total = results.length;
      const from = (params.page - 1) * params.pageSize;
      results = results.slice(from, from + params.pageSize);
      return { data: results, count: total };
    }

    return { data: results, count: count ?? 0 };
  };

  const countByStatuses = async (
    statuses: BookingStatus[],
    agencyId?: string
  ): Promise<number> => {
    const supabase = createAdminClient();
    let query = supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("status", statuses);
    if (agencyId) query = query.eq("agency_id", agencyId);
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  };

  const countActiveRentals = async (agencyId?: string): Promise<number> => {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    let query = supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid")
      .lte("start_date", now)
      .gte("end_date", now);
    if (agencyId) query = query.eq("agency_id", agencyId);
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  };

  const findDeparturesByDate = async (
    date: string,
    agencyId?: string
  ): Promise<BookingWithDetails[]> => {
    const supabase = createAdminClient();
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;
    let query = supabase
      .from("bookings")
      .select(BOOKING_WITH_DETAILS_SELECT)
      .gte("start_date", dayStart)
      .lte("start_date", dayEnd)
      .in("status", ["paid", "pending_payment"]);
    if (agencyId) query = query.eq("agency_id", agencyId);
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(toDomainBookingWithDetails);
  };

  const findReturnsByDate = async (
    date: string,
    agencyId?: string
  ): Promise<BookingWithDetails[]> => {
    const supabase = createAdminClient();
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;
    let query = supabase
      .from("bookings")
      .select(BOOKING_WITH_DETAILS_SELECT)
      .gte("end_date", dayStart)
      .lte("end_date", dayEnd)
      .in("status", ["paid", "pending_payment"]);
    if (agencyId) query = query.eq("agency_id", agencyId);
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(toDomainBookingWithDetails);
  };

  return {
    findById,
    findActiveAvailabilityViewsByVehicleId,
    findActiveAvailabilityViewsByVehicleIds,
    findPaidConflicts,
    create,
    update,
    findAllWithDetails,
    countByStatuses,
    countActiveRentals,
    findDeparturesByDate,
    findReturnsByDate,
  };
};
