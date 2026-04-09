import type { BookingRepository } from "@/domain/booking";
import type { VehicleRepository } from "@/domain/vehicle";
import { BookingStatus } from "@/domain/booking";

export interface InitiateBookingInput {
  vehicleId: string;
  startDate: string; // ISO
  endDate: string; // ISO
}

export interface InitiateBookingOutput {
  success: boolean;
  bookingId?: string;
  error?: string;
}

interface InitiateBookingDeps {
  vehicleRepository: VehicleRepository;
  bookingRepository: BookingRepository;
}

const INITIATED_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Creates a placeholder booking with status `initiated` as soon as the user
 * clicks on a vehicle. It carries no customer yet (filled in at the
 * `pending_payment` step) and expires after 2 hours.
 *
 * Replaces `actions/create-initiated-booking.ts`.
 */
export const createInitiateBookingUseCase = (deps: InitiateBookingDeps) => {
  const execute = async (
    input: InitiateBookingInput
  ): Promise<InitiateBookingOutput> => {
    const vehicle = await deps.vehicleRepository.findById(input.vehicleId);
    if (!vehicle) {
      return { success: false, error: "Véhicule introuvable." };
    }

    try {
      const booking = await deps.bookingRepository.create({
        vehicleId: input.vehicleId,
        agencyId: vehicle.agencyId,
        startDate: input.startDate,
        endDate: input.endDate,
        totalPrice: 0, // placeholder, set on pending_payment
        status: BookingStatus.Initiated,
        expiresAt: new Date(Date.now() + INITIATED_TTL_MS).toISOString(),
        customerId: null,
      });
      return { success: true, bookingId: booking.id };
    } catch (e) {
      return {
        success: false,
        error:
          e instanceof Error
            ? e.message
            : "Impossible de créer la réservation.",
      };
    }
  };

  return { execute };
};

export type InitiateBookingUseCase = ReturnType<
  typeof createInitiateBookingUseCase
>;
