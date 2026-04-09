import type { BookingRepository } from "@/domain/booking";
import type { PaymentRepository } from "@/domain/payment";

/**
 * Read-only use case backing the `/booking/success` page. Reads the state
 * left by the webhook in the database — performs **no** business logic.
 *
 * Replaces `actions/verify-checkout-session.ts`.
 *
 * The Stripe session lookup (to read metadata) goes through a port-style
 * callback so we don't leak Stripe types into the application layer.
 */

export type VerifyPaymentStatus =
  | "succeeded"
  | "refunded"
  | "rejected"
  | "pending"
  | "failed"
  | "unknown";

export type VerifyBookingStatus =
  | "paid"
  | "pending_payment"
  | "expired"
  | "refunded"
  | "payment_failed"
  | "cancelled"
  | "unknown";

export interface VerifyCheckoutSessionOutput {
  paymentStatus: VerifyPaymentStatus;
  bookingStatus: VerifyBookingStatus;
  bookingId?: string;
  error?: string;
}

export interface CheckoutSessionMetadataReader {
  retrieveCheckoutSessionMetadata(
    sessionId: string
  ): Promise<Record<string, string> | null>;
}

interface VerifyCheckoutSessionDeps {
  bookingRepository: BookingRepository;
  paymentRepository: PaymentRepository;
  metadataReader: CheckoutSessionMetadataReader;
}

export const createVerifyCheckoutSessionUseCase = (
  deps: VerifyCheckoutSessionDeps
) => {
  const execute = async (
    sessionId: string
  ): Promise<VerifyCheckoutSessionOutput> => {
    try {
      const metadata =
        await deps.metadataReader.retrieveCheckoutSessionMetadata(sessionId);
      if (!metadata) {
        return {
          paymentStatus: "unknown",
          bookingStatus: "unknown",
          error: "Session introuvable",
        };
      }

      const { bookingId, paymentId } = metadata;
      if (!bookingId || !paymentId) {
        return {
          paymentStatus: "unknown",
          bookingStatus: "unknown",
          error: "Métadonnées manquantes",
        };
      }

      const payment = await deps.paymentRepository.findById(paymentId);
      if (!payment) {
        return {
          paymentStatus: "unknown",
          bookingStatus: "unknown",
          bookingId,
          error: "Paiement introuvable",
        };
      }

      const booking = await deps.bookingRepository.findById(bookingId);
      if (!booking) {
        return {
          paymentStatus: payment.status as VerifyPaymentStatus,
          bookingStatus: "unknown",
          bookingId,
          error: "Booking introuvable",
        };
      }

      return {
        paymentStatus: payment.status as VerifyPaymentStatus,
        bookingStatus: booking.status as VerifyBookingStatus,
        bookingId,
      };
    } catch (e) {
      return {
        paymentStatus: "unknown",
        bookingStatus: "unknown",
        error: e instanceof Error ? e.message : "Erreur inconnue",
      };
    }
  };

  return { execute };
};

export type VerifyCheckoutSessionUseCase = ReturnType<
  typeof createVerifyCheckoutSessionUseCase
>;
