import type { BookingRepository } from "@/domain/booking";
import type { PaymentRepository, PaymentGateway } from "@/domain/payment";
import { PaymentStatus } from "@/domain/payment";
import { BookingStatus } from "@/domain/booking";

interface HandlePaymentFailedDeps {
  bookingRepository: BookingRepository;
  paymentRepository: PaymentRepository;
  paymentGateway: PaymentGateway;
}

/**
 * Handles `payment_intent.payment_failed`. Looks up the metadata via the
 * gateway, then marks both the payment and the booking as failed.
 */
export const createHandlePaymentFailedUseCase = (
  deps: HandlePaymentFailedDeps
) => {
  const execute = async (stripePaymentIntentId: string): Promise<void> => {
    const metadata = await deps.paymentGateway.findMetadataByPaymentIntentId(
      stripePaymentIntentId
    );
    if (!metadata) return;

    const { paymentId, bookingId } = metadata;
    if (paymentId) {
      await deps.paymentRepository.update(paymentId, {
        status: PaymentStatus.Failed,
        stripePaymentIntentId,
      });
    }
    if (bookingId) {
      await deps.bookingRepository.update(bookingId, {
        status: BookingStatus.PaymentFailed,
      });
    }
  };

  return { execute };
};

export type HandlePaymentFailedUseCase = ReturnType<
  typeof createHandlePaymentFailedUseCase
>;
