import type { Database } from "../database.types";
import type { Payment, PaymentStatus } from "@/domain/payment";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

export function toDomainPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    provider: row.provider,
    amount: row.amount,
    currency: row.currency,
    status: row.status as PaymentStatus,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
