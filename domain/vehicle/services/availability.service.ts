import type { BlockedPeriod } from "../blocked-period.vo";

/**
 * Vehicle availability — single source of truth.
 *
 * Replaces the three legacy implementations:
 *  - lib/utils.ts            → isVehicleAvailable()
 *  - lib/availability.ts     → isVehicleAvailableWithBookings(),
 *                              isVehicleAvailableExcludingBooking(),
 *                              getBlockedDatesForVehicle(),
 *                              filterOutCurrentBooking()
 *  - hooks/use-booking-summary.ts → inline rangeOverlapsBlockedPeriod()
 *
 * All overlap checks normalise dates to midnight (day-level granularity)
 * and treat ranges as inclusive on both ends, matching the historical behaviour.
 */

/**
 * Minimal booking shape required to evaluate availability.
 * Kept loose (snake_case) so it can wrap both DB rows and domain entities
 * without coupling. `id` is required so callers can identify conflicting
 * bookings (and so the Supabase row type matches without further casting).
 */
export interface BookingAvailabilityView {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
}

/** Statuses that block dates. Anything else (expired, cancelled, ...) is ignored. */
export const ACTIVE_BOOKING_STATUSES = ["pending_payment", "paid"] as const;

/** A vehicle, reduced to what availability checks actually need. */
export interface VehicleAvailabilityView {
  blockedPeriods: BlockedPeriod[];
}

export type ConflictSource = "blocked_period" | "booking";

export interface AvailabilityConflict {
  source: ConflictSource;
  /** Original start (with hours) of the conflicting period. */
  start: Date;
  /** Original end (with hours) of the conflicting period. */
  end: Date;
  /** Booking id if the conflict came from an existing booking. */
  bookingId?: string;
}

export interface AvailabilityOptions {
  /**
   * Booking id to exclude from the check. Used so a user editing their own
   * pending booking is not blocked by it. SECURITY: a `paid` booking is
   * NEVER excluded, even if its id matches.
   */
  excludeBookingId?: string | null;
}

// ---------- internal helpers ----------

function normaliseToMidnight(value: Date | string): Date {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function orderRange(start: Date, end: Date): [Date, Date] {
  return start.getTime() <= end.getTime() ? [start, end] : [end, start];
}

/** Inclusive day-level overlap. */
function dayRangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

function isActiveBooking(booking: BookingAvailabilityView): boolean {
  return (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(booking.status);
}

function shouldConsiderBooking(
  booking: BookingAvailabilityView,
  excludeBookingId?: string | null
): boolean {
  if (!isActiveBooking(booking)) return false;
  if (!excludeBookingId) return true;
  // Paid bookings are NEVER excluded.
  if (booking.status === "paid") return true;
  return booking.id !== excludeBookingId;
}

// ---------- public API ----------

/**
 * Returns the first conflict found, or `null` if the vehicle is available.
 * Returns a synthetic conflict for inverted/empty ranges.
 */
export function findAvailabilityConflict(
  vehicle: VehicleAvailabilityView,
  requestedStart: Date,
  requestedEnd: Date,
  bookings: BookingAvailabilityView[] = [],
  options: AvailabilityOptions = {}
): AvailabilityConflict | null {
  if (requestedEnd <= requestedStart) {
    return {
      source: "blocked_period",
      start: requestedStart,
      end: requestedEnd,
    };
  }

  const reqStart = normaliseToMidnight(requestedStart);
  const reqEnd = normaliseToMidnight(requestedEnd);

  // 1. Blocked periods
  for (const blocked of vehicle.blockedPeriods) {
    const rawStart = new Date(blocked.start);
    const rawEnd = new Date(blocked.end);
    const [orderedStart, orderedEnd] = orderRange(rawStart, rawEnd);

    if (
      dayRangesOverlap(
        reqStart,
        reqEnd,
        normaliseToMidnight(orderedStart),
        normaliseToMidnight(orderedEnd)
      )
    ) {
      return {
        source: "blocked_period",
        start: orderedStart,
        end: orderedEnd,
      };
    }
  }

  // 2. Active bookings
  for (const booking of bookings) {
    if (!shouldConsiderBooking(booking, options.excludeBookingId)) continue;

    const rawStart = new Date(booking.start_date);
    const rawEnd = new Date(booking.end_date);
    const [orderedStart, orderedEnd] = orderRange(rawStart, rawEnd);

    if (
      dayRangesOverlap(
        reqStart,
        reqEnd,
        normaliseToMidnight(orderedStart),
        normaliseToMidnight(orderedEnd)
      )
    ) {
      return {
        source: "booking",
        start: orderedStart,
        end: orderedEnd,
        bookingId: booking.id,
      };
    }
  }

  return null;
}

/**
 * Returns true if the vehicle is available for the requested range.
 */
export function isVehicleAvailable(
  vehicle: VehicleAvailabilityView,
  requestedStart: Date,
  requestedEnd: Date,
  bookings: BookingAvailabilityView[] = [],
  options: AvailabilityOptions = {}
): boolean {
  return (
    findAvailabilityConflict(
      vehicle,
      requestedStart,
      requestedEnd,
      bookings,
      options
    ) === null
  );
}

/**
 * Returns the list of dates (at midnight) that are blocked, combining
 * blocked periods and active bookings.
 */
export function getBlockedDates(
  vehicle: VehicleAvailabilityView,
  bookings: BookingAvailabilityView[] = [],
  options: AvailabilityOptions = {}
): Date[] {
  const result: Date[] = [];

  const pushRange = (rawStart: Date, rawEnd: Date) => {
    const [start, end] = orderRange(rawStart, rawEnd);
    const cursor = normaliseToMidnight(start);
    const last = normaliseToMidnight(end);
    while (cursor <= last) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  };

  for (const blocked of vehicle.blockedPeriods) {
    pushRange(new Date(blocked.start), new Date(blocked.end));
  }

  for (const booking of bookings) {
    if (!shouldConsiderBooking(booking, options.excludeBookingId)) continue;
    pushRange(new Date(booking.start_date), new Date(booking.end_date));
  }

  return result;
}
