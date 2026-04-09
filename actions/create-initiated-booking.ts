"use server";

import { getContainer } from "@/composition-root/container";

interface CreateInitiatedBookingParams {
  vehicleId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

interface CreateInitiatedBookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
}

/**
 * Server action: thin entry point that delegates to InitiateBookingUseCase.
 * Creates a placeholder `initiated` booking the moment the user picks a
 * vehicle. The booking carries no customer yet and expires after 2h.
 */
export async function createInitiatedBooking(
  params: CreateInitiatedBookingParams
): Promise<CreateInitiatedBookingResult> {
  const { initiateBookingUseCase } = getContainer();
  return initiateBookingUseCase.execute(params);
}
