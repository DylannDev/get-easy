/**
 * Port — abstracts the external payment provider (currently Stripe).
 *
 * The application layer talks to this interface; infrastructure provides
 * the concrete implementation in `infrastructure/stripe/`.
 */

export interface CheckoutSessionInput {
  bookingId: string;
  paymentId: string;
  customerId: string;
  customerEmail: string;
  amount: number; // in main currency unit (e.g. EUR), not cents
  currency: string;
  productName: string;
  productDescription: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  id: string;
  url: string | null;
}

export interface VerifiedWebhookEvent {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface PaymentGateway {
  /** Creates a hosted-checkout session and returns its id and redirect url. */
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession>;

  /**
   * Verifies a webhook payload signature and returns the parsed event.
   * Throws if the signature is invalid.
   */
  verifyWebhookSignature(
    rawBody: string,
    signature: string
  ): VerifiedWebhookEvent;

  /** Refunds a payment by its provider intent id. */
  refundByIntentId(intentId: string, reason: RefundReason): Promise<void>;

  /**
   * Returns metadata associated with a payment intent's checkout session
   * (used by the `payment_intent.payment_failed` handler).
   */
  findMetadataByPaymentIntentId(
    intentId: string
  ): Promise<Record<string, string> | null>;
}

export type RefundReason = "duplicate" | "requested_by_customer" | "fraudulent";
