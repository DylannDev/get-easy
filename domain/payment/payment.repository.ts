import type { Payment } from "./payment.entity";
import type { PaymentStatus } from "./payment-status";

export interface CreatePaymentInput {
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}

export interface UpdatePaymentInput {
  status?: PaymentStatus;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}

export interface PaymentRepository {
  findById(paymentId: string): Promise<Payment | null>;
  findByStripePaymentIntentId(
    stripePaymentIntentId: string
  ): Promise<Payment | null>;
  create(input: CreatePaymentInput): Promise<Payment>;
  update(paymentId: string, input: UpdatePaymentInput): Promise<Payment | null>;
  /**
   * Cleans up `created`-status payments for a booking. Used when a user
   * abandons checkout and re-submits — we drop the stale Stripe sessions.
   */
  deleteCreatedByBookingId(bookingId: string): Promise<void>;
}
