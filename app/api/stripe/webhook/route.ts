import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getContainer } from "@/composition-root/container";

/**
 * Stripe webhook entry point.
 *
 * Stays thin: verifies the signature via the PaymentGateway port and
 * dispatches each event to the appropriate use case. No Supabase queries,
 * no Resend calls, no business rules — those live in the application layer.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const headersList = await headers();
    const signature = headersList.get("stripe-signature");
    if (!signature) {
      console.error("❌ Signature Stripe manquante");
      return NextResponse.json(
        { error: "Signature manquante" },
        { status: 400 }
      );
    }

    const {
      paymentGateway,
      confirmBookingPaymentUseCase,
      handlePaymentFailedUseCase,
      recordRefundedChargeUseCase,
    } = getContainer();

    let event;
    try {
      event = paymentGateway.verifyWebhookSignature(body, signature);
    } catch (err) {
      const error = err as Error;
      console.error("❌ Erreur de vérification de signature:", error.message);
      return NextResponse.json(
        { error: `Erreur de webhook: ${error.message}` },
        { status: 400 }
      );
    }

    console.log("✅ Event Stripe reçu:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { bookingId, paymentId } = session.metadata || {};

        if (!bookingId || !paymentId) {
          console.error("❌ Métadonnées manquantes:", session.metadata);
          return NextResponse.json(
            { error: "Métadonnées manquantes" },
            { status: 400 }
          );
        }

        const outcome = await confirmBookingPaymentUseCase.execute({
          bookingId,
          paymentId,
          stripePaymentIntentId: (session.payment_intent as string) ?? null,
        });

        switch (outcome.kind) {
          case "approved":
            console.log("🎉 Paiement approuvé:", bookingId);
            return NextResponse.json({ received: true }, { status: 200 });
          case "rejected_not_found":
            return NextResponse.json(
              { error: "Réservation introuvable" },
              { status: 404 }
            );
          case "rejected_already_paid":
            return NextResponse.json(
              { error: "Réservation déjà payée" },
              { status: 400 }
            );
          case "rejected_dates_taken":
            return NextResponse.json(
              { error: "Véhicule déjà réservé pour ces dates" },
              { status: 409 }
            );
          case "error":
            return NextResponse.json(
              { error: outcome.message },
              { status: 500 }
            );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailedUseCase.execute(paymentIntent.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await recordRefundedChargeUseCase.execute(
            charge.payment_intent as string
          );
        }
        break;
      }

      default:
        console.log(`ℹ️ Event non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Erreur dans le webhook:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
