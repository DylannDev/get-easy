"use server";

import { getContainer } from "@/composition-root/container";
import { findAvailabilityConflict } from "@/domain/vehicle";

interface CheckVehicleAvailabilityParams {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  /** Booking id to exclude (the user's own pending booking). */
  excludeBookingId?: string;
}

interface CheckVehicleAvailabilityResult {
  available: boolean;
  conflictStart?: string;
  conflictEnd?: string;
  conflictStatus?: "blocked_period" | "paid" | "pending_payment";
}

/**
 * Server action: thin wrapper that loads vehicle + active bookings via the
 * repositories and delegates the conflict detection to the domain service.
 *
 * The previous version (~160 lines) duplicated the availability logic that
 * already lived in `lib/utils.ts`, `lib/availability.ts` and the
 * `useBookingSummary` hook. All four implementations now share the same
 * code path in `domain/vehicle/services/availability.service.ts`.
 */
export async function checkVehicleAvailability({
  vehicleId,
  startDate,
  endDate,
  excludeBookingId,
}: CheckVehicleAvailabilityParams): Promise<CheckVehicleAvailabilityResult> {
  try {
    const { vehicleRepository, bookingRepository } = getContainer();

    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      // Fail-open: webhook does the final check anyway.
      return { available: true };
    }

    const bookings =
      await bookingRepository.findActiveAvailabilityViewsByVehicleId(vehicleId);

    const conflict = findAvailabilityConflict(
      vehicle,
      startDate,
      endDate,
      bookings,
      { excludeBookingId }
    );

    if (!conflict) return { available: true };

    return {
      available: false,
      conflictStart: conflict.start.toISOString(),
      conflictEnd: conflict.end.toISOString(),
      conflictStatus:
        conflict.source === "blocked_period"
          ? "blocked_period"
          : (bookings.find((b) => b.id === conflict.bookingId)?.status as
              | "paid"
              | "pending_payment"
              | undefined) ?? "paid",
    };
  } catch {
    // Fail-open: webhook does the final check.
    return { available: true };
  }
}
