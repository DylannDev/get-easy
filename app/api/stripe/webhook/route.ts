import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Récupérer le body en tant que texte brut
    const body = await request.text();

    // Récupérer la signature Stripe
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("❌ Signature Stripe manquante");
      return NextResponse.json(
        { error: "Signature manquante" },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SECRET non configuré");
      return NextResponse.json(
        { error: "Configuration webhook manquante" },
        { status: 500 }
      );
    }

    // Vérifier la signature Stripe
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const error = err as Error;
      console.error("❌ Erreur de vérification de signature:", error.message);
      return NextResponse.json(
        { error: `Erreur de webhook: ${error.message}` },
        { status: 400 }
      );
    }

    console.log("✅ Event Stripe reçu:", event.type);

    // Créer le client Supabase admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Traiter les différents types d'événements
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("💳 Checkout session completed:", session.id);

        // Récupérer les métadonnées
        const { bookingId, paymentId } = session.metadata || {};

        if (!bookingId || !paymentId) {
          console.error("❌ Métadonnées manquantes:", session.metadata);
          return NextResponse.json(
            { error: "Métadonnées manquantes" },
            { status: 400 }
          );
        }

        console.log("📝 Mise à jour du paiement:", paymentId);
        console.log("📝 Mise à jour de la réservation:", bookingId);

        // 1. Mettre à jour le paiement
        const { error: paymentUpdateError } = await supabase
          .from("payments")
          .update({
            status: "succeeded",
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq("id", paymentId);

        if (paymentUpdateError) {
          console.error(
            "❌ Erreur lors de la mise à jour du paiement:",
            paymentUpdateError
          );
          return NextResponse.json(
            { error: "Erreur de mise à jour du paiement" },
            { status: 500 }
          );
        }

        console.log("✅ Paiement mis à jour avec succès");

        // 2. Mettre à jour la réservation
        const { error: bookingUpdateError } = await supabase
          .from("bookings")
          .update({
            status: "paid",
          })
          .eq("id", bookingId);

        if (bookingUpdateError) {
          console.error(
            "❌ Erreur lors de la mise à jour de la réservation:",
            bookingUpdateError
          );
          return NextResponse.json(
            { error: "Erreur de mise à jour de la réservation" },
            { status: 500 }
          );
        }

        console.log("✅ Réservation mise à jour avec succès");
        console.log("🎉 Paiement complété pour la réservation:", bookingId);

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.log("❌ Payment failed:", paymentIntent.id);

        // Récupérer la session associée pour avoir les métadonnées
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1,
        });

        if (sessions.data.length > 0) {
          const session = sessions.data[0];
          const { bookingId, paymentId } = session.metadata || {};

          if (paymentId) {
            // Mettre à jour le statut du paiement
            const { error: paymentUpdateError } = await supabase
              .from("payments")
              .update({
                status: "failed",
                stripe_payment_intent_id: paymentIntent.id,
              })
              .eq("id", paymentId);

            if (paymentUpdateError) {
              console.error(
                "❌ Erreur lors de la mise à jour du paiement:",
                paymentUpdateError
              );
            } else {
              console.log("✅ Paiement marqué comme échoué");
            }
          }

          if (bookingId) {
            // Mettre à jour le statut de la réservation
            const { error: bookingUpdateError } = await supabase
              .from("bookings")
              .update({
                status: "payment_failed",
              })
              .eq("id", bookingId);

            if (bookingUpdateError) {
              console.error(
                "❌ Erreur lors de la mise à jour de la réservation:",
                bookingUpdateError
              );
            } else {
              console.log("✅ Réservation marquée comme paiement échoué");
            }
          }
        }

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        console.log("💸 Charge refunded:", charge.id);

        // Trouver le paiement associé
        if (charge.payment_intent) {
          const { data: payment } = await supabase
            .from("payments")
            .select("id, booking_id")
            .eq("stripe_payment_intent_id", charge.payment_intent as string)
            .single();

          if (payment) {
            // Mettre à jour le statut du paiement
            const { error: paymentUpdateError } = await supabase
              .from("payments")
              .update({
                status: "refunded",
              })
              .eq("id", payment.id);

            if (paymentUpdateError) {
              console.error(
                "❌ Erreur lors de la mise à jour du paiement:",
                paymentUpdateError
              );
            } else {
              console.log("✅ Paiement marqué comme remboursé");
            }

            // Mettre à jour le statut de la réservation
            const { error: bookingUpdateError } = await supabase
              .from("bookings")
              .update({
                status: "refunded",
              })
              .eq("id", payment.booking_id);

            if (bookingUpdateError) {
              console.error(
                "❌ Erreur lors de la mise à jour de la réservation:",
                bookingUpdateError
              );
            } else {
              console.log("✅ Réservation marquée comme remboursée");
            }
          }
        }

        break;
      }

      default:
        console.log(`ℹ️ Event non géré: ${event.type}`);
    }

    // Retourner une réponse de succès
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Erreur dans le webhook:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
