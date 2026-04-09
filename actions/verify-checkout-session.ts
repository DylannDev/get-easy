"use server";

import { getContainer } from "@/composition-root/container";
import type {
  VerifyPaymentStatus,
  VerifyBookingStatus,
} from "@/application/booking/verify-checkout-session.use-case";

interface VerifyCheckoutSessionResult {
  paymentStatus: VerifyPaymentStatus;
  bookingStatus: VerifyBookingStatus;
  bookingId?: string;
  error?: string;
}

/**
 * Server action: thin entry point that delegates to
 * VerifyCheckoutSessionUseCase. Read-only, used by `/booking/success`.
 */
export async function verifyCheckoutSession(
  sessionId: string
): Promise<VerifyCheckoutSessionResult> {
  const { verifyCheckoutSessionUseCase } = getContainer();
  return verifyCheckoutSessionUseCase.execute(sessionId);
}
