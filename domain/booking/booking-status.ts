/**
 * BookingStatus — finite state of a booking.
 *
 * Allowed transitions (enforced by the domain layer in Phase 4):
 *   initiated       -> pending_payment | expired
 *   pending_payment -> paid | payment_failed | expired | cancelled
 *   paid            -> refunded | cancelled
 *   payment_failed  -> pending_payment | cancelled
 *   expired         -> (terminal)
 *   refunded        -> (terminal)
 *   cancelled       -> (terminal)
 */
export const BookingStatus = {
  Initiated: "initiated",
  PendingPayment: "pending_payment",
  Paid: "paid",
  PaymentFailed: "payment_failed",
  Expired: "expired",
  Refunded: "refunded",
  Cancelled: "cancelled",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
