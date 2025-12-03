"use server";

import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

interface VerifyCheckoutSessionResult {
  paymentStatus:
    | "succeeded"
    | "refunded"
    | "rejected"
    | "pending"
    | "failed"
    | "unknown";
  bookingStatus:
    | "paid"
    | "pending_payment"
    | "expired"
    | "refunded"
    | "payment_failed"
    | "cancelled"
    | "unknown";
  bookingId?: string;
  error?: string;
}

/**
 * Vérifie le statut réel d'un paiement et d'une réservation
 * en lisant les données en base de données.
 *
 * Cette fonction NE FAIT QUE LIRE l'état laissé par le webhook,
 * elle ne contient AUCUNE logique métier d'overlap ou de validation.
 *
 * @param sessionId - L'ID de la session Stripe Checkout
 * @returns Le statut du paiement et du booking
 */
export async function verifyCheckoutSession(
  sessionId: string
): Promise<VerifyCheckoutSessionResult> {
  try {
    console.log("🔍 Vérification checkout session:", sessionId);

    // 1. Récupérer la session Stripe pour obtenir les métadonnées
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      console.error("❌ Session Stripe introuvable:", sessionId);
      return {
        paymentStatus: "unknown",
        bookingStatus: "unknown",
        error: "Session introuvable",
      };
    }

    // 2. Extraire les métadonnées
    const { bookingId, paymentId } = session.metadata || {};

    if (!bookingId || !paymentId) {
      console.error("❌ Métadonnées manquantes:", session.metadata);
      return {
        paymentStatus: "unknown",
        bookingStatus: "unknown",
        error: "Métadonnées manquantes",
      };
    }

    // 3. Créer le client Supabase admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 4. Récupérer le statut du paiement en BDD
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("status")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      console.error("❌ Paiement introuvable:", paymentError);
      return {
        paymentStatus: "unknown",
        bookingStatus: "unknown",
        bookingId,
        error: "Paiement introuvable",
      };
    }

    // 5. Récupérer le statut du booking en BDD
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("status")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("❌ Booking introuvable:", bookingError);
      return {
        paymentStatus: payment.status as VerifyCheckoutSessionResult["paymentStatus"],
        bookingStatus: "unknown",
        bookingId,
        error: "Booking introuvable",
      };
    }

    console.log(
      `✅ Vérification terminée - Payment: ${payment.status}, Booking: ${booking.status}`
    );

    // 6. Retourner les statuts réels tels qu'ils sont en BDD
    return {
      paymentStatus: payment.status as VerifyCheckoutSessionResult["paymentStatus"],
      bookingStatus: booking.status as VerifyCheckoutSessionResult["bookingStatus"],
      bookingId,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du checkout:", error);
    return {
      paymentStatus: "unknown",
      bookingStatus: "unknown",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
