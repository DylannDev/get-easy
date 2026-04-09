import type { BookingRepository } from "@/domain/booking";
import { BookingStatus } from "@/domain/booking";
import type { PaymentRepository } from "@/domain/payment";
import { PaymentStatus } from "@/domain/payment";

interface RecordRefundedChargeDeps {
  bookingRepository: BookingRepository;
  paymentRepository: PaymentRepository;
}

/**
 * Handles the Stripe `charge.refunded` webhook event. Looks up the payment
 * by its intent id, then marks both the payment and its booking as refunded.
 */
export const createRecordRefundedChargeUseCase = (
  deps: RecordRefundedChargeDeps
) => {
  const execute = async (stripePaymentIntentId: string): Promise<void> => {
    const payment = await deps.paymentRepository.findByStripePaymentIntentId(
      stripePaymentIntentId
    );
    if (!payment) return;

    await deps.paymentRepository.update(payment.id, {
      status: PaymentStatus.Refunded,
    });
    await deps.bookingRepository.update(payment.bookingId, {
      status: BookingStatus.Refunded,
    });
  };

  return { execute };
};

export type RecordRefundedChargeUseCase = ReturnType<
  typeof createRecordRefundedChargeUseCase
>;
