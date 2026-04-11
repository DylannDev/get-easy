import type { Booking } from "./booking.entity";
import type { BookingWithDetails } from "./booking-with-details";
import type { BookingStatus } from "./booking-status";
import type { BookingAvailabilityView } from "../vehicle/services/availability.service";

/**
 * Data required to create a booking.
 * `customerId` is optional because the "initiated" flow creates a booking
 * before the customer has filled in the form.
 */
export interface CreateBookingInput {
  customerId?: string | null;
  vehicleId: string;
  agencyId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  totalPrice: number;
  status: BookingStatus;
  expiresAt?: string | null;
}

export interface UpdateBookingInput {
  customerId?: string;
  vehicleId?: string;
  agencyId?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  status?: BookingStatus;
  expiresAt?: string | null;
}

/**
 * Port — implemented by infrastructure.
 */
export interface BookingRepository {
  findById(bookingId: string): Promise<Booking | null>;

  /**
   * Returns active bookings for a vehicle, in the lightweight shape
   * consumed by the availability domain service. Only `paid` and
   * `pending_payment` bookings whose end_date is in the future are returned.
   */
  findActiveAvailabilityViewsByVehicleId(
    vehicleId: string
  ): Promise<BookingAvailabilityView[]>;

  /**
   * Same as above, but for several vehicles in one round-trip.
   * The map's value is the list of active bookings for that vehicle id.
   */
  findActiveAvailabilityViewsByVehicleIds(
    vehicleIds: string[]
  ): Promise<Map<string, BookingAvailabilityView[]>>;

  /**
   * Returns paid bookings overlapping the given window for a vehicle,
   * excluding the booking with `excludeBookingId` (the one being paid for).
   * Used by the payment confirmation use case to detect race conditions.
   */
  findPaidConflicts(args: {
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    excludeBookingId: string;
  }): Promise<BookingAvailabilityView[]>;

  create(input: CreateBookingInput): Promise<Booking>;

  /**
   * Updates a booking. Returns the updated entity, or null if no row matched
   * the optional `expectedStatuses` guard.
   */
  update(
    bookingId: string,
    input: UpdateBookingInput,
    options?: { expectedStatuses?: BookingStatus[] }
  ): Promise<Booking | null>;

  // ── Admin queries ─────────────────────────────────────────────

  /**
   * Returns bookings with customer/vehicle details, with filtering,
   * sorting, and pagination. Used by the admin reservations list.
   */
  findAllWithDetails(params: {
    page: number;
    pageSize: number;
    agencyId?: string;
    statuses?: BookingStatus[];
    search?: string;
    startDate?: string;
    endDate?: string;
    sort?: { field: string; direction: "asc" | "desc" };
  }): Promise<{ data: BookingWithDetails[]; count: number }>;

  /**
   * Counts bookings matching the given statuses.
   */
  countByStatuses(statuses: BookingStatus[], agencyId?: string): Promise<number>;

  /**
   * Counts paid bookings where start_date <= now and end_date >= now.
   */
  countActiveRentals(agencyId?: string): Promise<number>;

  /**
   * Returns bookings (with details) whose start_date falls on the given date.
   */
  findDeparturesByDate(date: string, agencyId?: string): Promise<BookingWithDetails[]>;

  /**
   * Returns bookings (with details) whose end_date falls on the given date.
   */
  findReturnsByDate(date: string, agencyId?: string): Promise<BookingWithDetails[]>;
}
