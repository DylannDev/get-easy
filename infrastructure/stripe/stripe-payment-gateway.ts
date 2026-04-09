import type {
  PaymentGateway,
  CheckoutSession,
  CheckoutSessionInput,
  RefundReason,
  VerifiedWebhookEvent,
} from "@/domain/payment";
import type { CheckoutSessionMetadataReader } from "@/application/booking/verify-checkout-session.use-case";
import { stripe } from "./stripe.client";

interface StripePaymentGatewayDeps {
  webhookSecret: string;
}

/**
 * Stripe adapter implementing the domain `PaymentGateway` port.
 *
 * Wraps the Stripe SDK so the application layer never sees Stripe types
 * directly. Translates between the domain shapes (amounts in main units,
 * generic refund reasons) and Stripe's API conventions (cents,
 * Stripe-specific reason strings).
 *
 * Also satisfies `CheckoutSessionMetadataReader` (used by the verify
 * checkout-session use case) — read-only metadata lookup.
 */
export const createStripePaymentGateway = (
  deps: StripePaymentGatewayDeps
): PaymentGateway & CheckoutSessionMetadataReader => {
  const createCheckoutSession = async (
    input: CheckoutSessionInput
  ): Promise<CheckoutSession> => {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: input.currency.toLowerCase(),
            product_data: {
              name: input.productName,
              description: input.productDescription,
            },
            unit_amount: Math.round(input.amount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: input.customerEmail,
      metadata: {
        bookingId: input.bookingId,
        paymentId: input.paymentId,
        customerId: input.customerId,
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    return { id: session.id, url: session.url ?? null };
  };

  const verifyWebhookSignature = (
    rawBody: string,
    signature: string
  ): VerifiedWebhookEvent => {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      deps.webhookSecret
    );
    return { type: event.type, data: event.data };
  };

  const refundByIntentId = async (
    intentId: string,
    reason: RefundReason
  ): Promise<void> => {
    await stripe.refunds.create({
      payment_intent: intentId,
      reason,
    });
  };

  const findMetadataByPaymentIntentId = async (
    intentId: string
  ): Promise<Record<string, string> | null> => {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: intentId,
      limit: 1,
    });
    if (sessions.data.length === 0) return null;
    const metadata = sessions.data[0].metadata ?? {};
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === "string") result[key] = value;
    }
    return result;
  };

  const retrieveCheckoutSessionMetadata = async (
    sessionId: string
  ): Promise<Record<string, string> | null> => {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) return null;
    const metadata = session.metadata ?? {};
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === "string") result[key] = value;
    }
    return result;
  };

  return {
    createCheckoutSession,
    verifyWebhookSignature,
    refundByIntentId,
    findMetadataByPaymentIntentId,
    retrieveCheckoutSessionMetadata,
  };
};

export type StripePaymentGateway = ReturnType<typeof createStripePaymentGateway>;
