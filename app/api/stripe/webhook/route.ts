import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import {
  sendBookingPaidClientEmail,
  sendBookingPaidAdminEmail,
  sendBookingRejectedEmail,
} from "@/actions/send-email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

        console.log("📝 Validation de la réservation:", bookingId);

        // 🔒 VALIDATION 1 : Récupérer et vérifier que le booking existe encore
        const { data: booking, error: bookingFetchError } = await supabase
          .from("bookings")
          .select(
            "id, status, expires_at, start_date, end_date, vehicle_id, customer_id"
          )
          .eq("id", bookingId)
          .single();

        if (bookingFetchError || !booking) {
          console.error("❌ Booking introuvable:", bookingFetchError);

          // Marquer le paiement comme refunded (on va rembourser)
          await supabase
            .from("payments")
            .update({ status: "refunded" })
            .eq("id", paymentId);

          // Déclencher un remboursement Stripe
          try {
            if (session.payment_intent) {
              await stripe.refunds.create({
                payment_intent: session.payment_intent as string,
                reason: "requested_by_customer",
              });
              console.log(
                "✅ Remboursement Stripe initié (booking introuvable)"
              );
            }
          } catch (refundError) {
            console.error("❌ Erreur lors du remboursement:", refundError);
          }

          return NextResponse.json(
            { error: "Réservation introuvable" },
            { status: 404 }
          );
        }

        // 🔒 VALIDATION 2 : Vérifier que le booking n'est pas déjà payé
        // On accepte tous les statuts sauf "paid" (pending_payment, expired, etc.)
        if (booking.status === "paid") {
          console.error(
            `❌ Paiement refusé : booking déjà payé (statut "${booking.status}")`
          );

          // Marquer le paiement comme refunded (paiement en double)
          await supabase
            .from("payments")
            .update({ status: "refunded" })
            .eq("id", paymentId);

          // Récupérer les infos client pour l'email
          const { data: customerData } = await supabase
            .from("customers")
            .select("first_name, last_name, email")
            .eq("id", booking.customer_id)
            .single();

          const { data: vehicleData } = await supabase
            .from("vehicles")
            .select("brand, model")
            .eq("id", booking.vehicle_id)
            .single();

          // Envoyer email de rejet (paiement en double)
          if (customerData && vehicleData) {
            await sendBookingRejectedEmail({
              to: customerData.email,
              firstName: customerData.first_name,
              lastName: customerData.last_name,
              vehicle: {
                brand: vehicleData.brand,
                model: vehicleData.model,
              },
              startDate: format(new Date(booking.start_date), "dd MMMM yyyy", {
                locale: fr,
              }),
              endDate: format(new Date(booking.end_date), "dd MMMM yyyy", {
                locale: fr,
              }),
              reason: "already_paid",
            });
          }

          // Déclencher un remboursement Stripe
          try {
            if (session.payment_intent) {
              await stripe.refunds.create({
                payment_intent: session.payment_intent as string,
                reason: "duplicate",
              });
              console.log("✅ Remboursement Stripe initié (booking déjà payé)");
            }
          } catch (refundError) {
            console.error("❌ Erreur lors du remboursement:", refundError);
          }

          return NextResponse.json(
            { error: "Réservation déjà payée" },
            { status: 400 }
          );
        }

        // 🔒 VALIDATION 3 : Vérifier que les dates sont toujours disponibles
        // Règle métier SIMPLIFIÉE :
        // ✅ BLOQUER uniquement si un booking "paid" chevauche les dates
        // ❌ IGNORER tous les autres statuts (pending_payment, expired, payment_failed, etc.)
        //
        // Pourquoi ? Deux clients peuvent aller jusqu'à Stripe en parallèle.
        // Le premier qui paie gagne. Le second sera rejeté seulement si le premier a finalisé.

        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);

        // ⚡ OPTIMISÉ : Récupérer UNIQUEMENT les bookings "paid" futurs/en cours
        const { data: paidBookings, error: checkError } = await supabase
          .from("bookings")
          .select("id, start_date, end_date")
          .eq("vehicle_id", booking.vehicle_id)
          .eq("status", "paid") // ← SEULS LES BOOKINGS PAYÉS COMPTENT
          .neq("id", bookingId) // Exclure le booking courant
          .gte("end_date", bookingStart.toISOString()); // Exclure les réservations passées

        if (checkError) {
          console.error("❌ Erreur vérification disponibilité:", checkError);
          return NextResponse.json(
            { received: true, error: "Database error" },
            { status: 500 }
          );
        }

        // Vérifier si un booking "paid" bloque ces dates
        const hasConflict = (paidBookings || []).some(
          (otherBooking: {
            id: string;
            start_date: string;
            end_date: string;
          }) => {
            const otherStart = new Date(otherBooking.start_date);
            const otherEnd = new Date(otherBooking.end_date);
            otherStart.setHours(0, 0, 0, 0);
            otherEnd.setHours(0, 0, 0, 0);

            // Logique d'overlap
            const overlaps = bookingStart <= otherEnd && bookingEnd >= otherStart;
            if (overlaps) {
              console.log(
                `❌ Conflit détecté : booking ${otherBooking.id} (paid) chevauche les dates`
              );
              return true;
            }

            return false;
          }
        );

        if (hasConflict) {
          console.error(
            "❌ Paiement refusé : dates déjà réservées par un autre client"
          );

          // Marquer le booking comme refunded (car on va rembourser)
          await supabase
            .from("bookings")
            .update({ status: "refunded" })
            .eq("id", bookingId);

          // Marquer le paiement comme refunded
          await supabase
            .from("payments")
            .update({ status: "refunded" })
            .eq("id", paymentId);

          // Récupérer les infos client pour l'email
          const { data: customerData } = await supabase
            .from("customers")
            .select("first_name, last_name, email")
            .eq("id", booking.customer_id)
            .single();

          const { data: vehicleData } = await supabase
            .from("vehicles")
            .select("brand, model")
            .eq("id", booking.vehicle_id)
            .single();

          // Envoyer email de rejet
          if (customerData && vehicleData) {
            await sendBookingRejectedEmail({
              to: customerData.email,
              firstName: customerData.first_name,
              lastName: customerData.last_name,
              vehicle: {
                brand: vehicleData.brand,
                model: vehicleData.model,
              },
              startDate: format(new Date(booking.start_date), "dd MMMM yyyy", {
                locale: fr,
              }),
              endDate: format(new Date(booking.end_date), "dd MMMM yyyy", {
                locale: fr,
              }),
              reason: "unavailable",
            });
          }

          // Déclencher un remboursement Stripe
          try {
            if (session.payment_intent) {
              await stripe.refunds.create({
                payment_intent: session.payment_intent as string,
                reason: "requested_by_customer",
              });
              console.log(
                "✅ Remboursement Stripe initié (dates indisponibles)"
              );
            }
          } catch (refundError) {
            console.error("❌ Erreur lors du remboursement:", refundError);
          }

          return NextResponse.json(
            { error: "Véhicule déjà réservé pour ces dates" },
            { status: 409 }
          );
        }

        // ✅ Aucun booking "paid" ne bloque : on accepte le paiement
        // (Fonctionne même si booking était expiré ou si d'autres pending_payment existent)
        console.log(
          `✅ Aucun conflit avec bookings payés - Paiement accepté (booking status: ${booking.status})`
        );

        console.log("✅ Toutes les validations sont passées");

        // ✅ TOUTES LES VALIDATIONS SONT OK : Approuver le paiement

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

        // 3. Récupérer les informations complètes pour envoyer les emails
        const { data: bookingData } = await supabase
          .from("bookings")
          .select(
            `
            *,
            customer:customers(*),
            vehicle:vehicles(brand, model),
            agency:agencies(*)
          `
          )
          .eq("id", bookingId)
          .single();

        if (bookingData) {
          const { customer, vehicle, start_date, end_date, total_price } =
            bookingData;

          // Formater les dates
          const formattedStartDate = format(
            new Date(start_date),
            "dd MMMM yyyy",
            { locale: fr }
          );
          const formattedEndDate = format(new Date(end_date), "dd MMMM yyyy", {
            locale: fr,
          });

          // 4. Envoyer l'email de confirmation au client
          const clientEmailResult = await sendBookingPaidClientEmail({
            to: customer.email,
            firstName: customer.first_name,
            lastName: customer.last_name,
            email: customer.email,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            totalPrice: total_price,
            vehicle: {
              brand: vehicle.brand,
              model: vehicle.model,
            },
          });

          if (!clientEmailResult.success) {
            console.error(
              "⚠️ Échec de l'envoi de l'email client:",
              clientEmailResult.error
            );
          }

          // 5. Envoyer l'email de notification à l'admin
          // TODO: Récupérer l'email de l'administrateur de l'agence depuis la base de données
          // Pour l'instant, on utilise une variable d'environnement
          const adminEmail = process.env.ADMIN_EMAIL || "contact@vizionweb.fr";

          const adminEmailResult = await sendBookingPaidAdminEmail({
            to: adminEmail,
            firstName: customer.first_name,
            lastName: customer.last_name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            bookingId: bookingId,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            totalPrice: total_price,
            vehicle: {
              brand: vehicle.brand,
              model: vehicle.model,
            },
          });

          if (!adminEmailResult.success) {
            console.error(
              "⚠️ Échec de l'envoi de l'email admin:",
              adminEmailResult.error
            );
          }

          console.log("📧 Emails de confirmation envoyés");
        } else {
          console.error(
            "❌ Impossible de récupérer les données du booking pour envoyer les emails"
          );
        }

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
