import type { PaymentStatus } from "./payment-status";

export interface Payment {
  id: string;
  bookingId: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
}
