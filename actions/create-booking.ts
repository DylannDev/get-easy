"use server";

import { createAdminClient } from "@/lib/supabase/server";
import type { BookingFormData } from "@/lib/validations/booking";
import { parse, format } from "date-fns";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

interface CreateBookingParams {
  customerData: BookingFormData;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  agencyId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  bookingId?: string; // ID du booking "initiated" à mettre à jour (optionnel)
}

interface CreateBookingResult {
  success: boolean;
  customerId?: string;
  bookingId?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Convertit une date du format français "JJ/MM/AAAA" au format SQL "YYYY-MM-DD"
 * @param frenchDate - Date au format "JJ/MM/AAAA"
 * @returns Date au format "YYYY-MM-DD" ou null si la date est vide/invalide
 */
function convertFrenchDateToSQL(frenchDate: string | undefined): string | null {
  if (!frenchDate) return null;

  try {
    const parsed = parse(frenchDate, "dd/MM/yyyy", new Date());
    return format(parsed, "yyyy-MM-dd");
  } catch (error) {
    console.error("❌ Erreur de conversion de date:", frenchDate, error);
    return null;
  }
}

export async function createBookingAction(
  params: CreateBookingParams
): Promise<CreateBookingResult> {
  try {
    const { customerData, vehicleId, vehicleBrand, vehicleModel, agencyId, startDate, endDate, totalPrice, bookingId } = params;

    // Créer le client Supabase avec service role pour les opérations admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Récupérer l'origin pour les URLs de redirection
    const headersList = await headers();
    const origin = headersList.get("origin") || headersList.get("referer")?.split("/").slice(0, 3).join("/") || "http://localhost:3000";

    // 1. Vérifier si un customer existe déjà avec cet email
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", customerData.email)
      .single();

    let customerId: string;

    if (existingCustomer) {
      // Client existant, réutiliser son ID
      customerId = existingCustomer.id;
      console.log("✅ Client existant trouvé:", customerId);
    } else {
      // Nouveau client, créer un enregistrement
      const { data: newCustomer, error: customerInsertError } = await supabase
        .from("customers")
        .insert({
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          birth_date: convertFrenchDateToSQL(customerData.birthDate),
          birth_place: customerData.birthPlace,
          address: customerData.address,
          address2: customerData.address2 || null,
          postal_code: customerData.postalCode,
          city: customerData.city,
          country: customerData.country,
          driver_license_number: customerData.driverLicenseNumber || null,
          driver_license_issued_at: convertFrenchDateToSQL(customerData.driverLicenseIssuedAt),
          driver_license_country: customerData.driverLicenseCountry || null,
        })
        .select()
        .single();

      if (customerInsertError || !newCustomer) {
        console.error("❌ Erreur lors de la création du client:", customerInsertError);
        console.error("Détails de l'erreur:", JSON.stringify(customerInsertError, null, 2));
        return {
          success: false,
          error: `Impossible de créer le client: ${customerInsertError?.message || 'Erreur inconnue'}`,
        };
      }

      customerId = newCustomer.id;
      console.log("✅ Nouveau client créé:", customerId);
    }

    // 2. Créer ou mettre à jour la réservation avec status "pending_payment" et expiration
    // La réservation expire après 10 minutes si le paiement n'est pas effectué
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let booking;
    let bookingError;

    if (bookingId) {
      // Si un bookingId est fourni, vérifier d'abord le status du booking
      const { data: existingBooking, error: fetchError } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("id", bookingId)
        .single();

      if (fetchError || !existingBooking) {
        console.error("❌ Impossible de récupérer le booking:", fetchError);
        return {
          success: false,
          error: "Réservation introuvable. Veuillez réessayer.",
        };
      }

      // SÉCURITÉ: Bloquer si le booking est déjà payé
      if (existingBooking.status === "paid") {
        console.error("❌ Tentative de modification d'un booking payé:", bookingId);
        return {
          success: false,
          error: "Cette réservation a déjà été payée et ne peut plus être modifiée.",
        };
      }

      // SÉCURITÉ: Bloquer si le booking est annulé ou expiré
      if (["cancelled", "expired"].includes(existingBooking.status)) {
        console.error("❌ Tentative de modification d'un booking invalide:", bookingId);
        return {
          success: false,
          error: "Cette réservation n'est plus valide. Veuillez créer une nouvelle réservation.",
        };
      }

      // Si on arrive ici, le booking est "initiated" ou "pending_payment" → on peut le mettre à jour
      const { data, error } = await supabase
        .from("bookings")
        .update({
          customer_id: customerId,
          vehicle_id: vehicleId,
          agency_id: agencyId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          total_price: totalPrice,
          status: "pending_payment",
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", bookingId)
        .in("status", ["initiated", "pending_payment"]) // Double sécurité au niveau DB
        .select()
        .single();

      booking = data;
      bookingError = error;

      if (bookingError || !booking) {
        console.error("❌ Erreur lors de la mise à jour de la réservation:", bookingError);
        return {
          success: false,
          error: "Impossible de mettre à jour la réservation. Veuillez réessayer.",
        };
      }

      console.log("✅ Réservation mise à jour vers 'pending_payment':", booking.id);
    } else {
      // Sinon, créer une nouvelle réservation (ancien flow)
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: customerId,
          vehicle_id: vehicleId,
          agency_id: agencyId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          total_price: totalPrice,
          status: "pending_payment",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      booking = data;
      bookingError = error;

      if (bookingError || !booking) {
        console.error("❌ Erreur lors de la création de la réservation:", bookingError);
        return {
          success: false,
          error: "Impossible de créer la réservation. Veuillez réessayer.",
        };
      }

      console.log("✅ Réservation créée:", booking.id);
    }

    // 3. Gérer les paiements
    // Si on met à jour un booking existant, supprimer les anciens payments "created"
    // pour éviter les doublons et nettoyer les sessions Stripe abandonnées
    if (bookingId) {
      const { error: deleteError } = await supabase
        .from("payments")
        .delete()
        .eq("booking_id", booking.id)
        .eq("status", "created");

      if (deleteError) {
        console.warn("⚠️ Erreur lors de la suppression des anciens payments:", deleteError);
        // On continue quand même, ce n'est pas bloquant
      } else {
        console.log("✅ Anciens payments supprimés pour booking:", booking.id);
      }
    }

    // 4. Créer une nouvelle entrée dans la table payments
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        booking_id: booking.id,
        amount: totalPrice,
        currency: "EUR",
        status: "created",
        provider: "stripe",
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error("❌ Erreur lors de la création du paiement:", paymentError);
      return {
        success: false,
        error: "Impossible de créer le paiement. Veuillez réessayer.",
      };
    }

    console.log("✅ Paiement créé:", payment.id);

    // 5. Créer une Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Location ${vehicleBrand} ${vehicleModel}`,
              description: `Réservation du ${format(startDate, "dd/MM/yyyy")} au ${format(endDate, "dd/MM/yyyy")}`,
            },
            unit_amount: Math.round(totalPrice * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ],
      customer_email: customerData.email,
      metadata: {
        bookingId: booking.id,
        paymentId: payment.id,
        customerId,
      },
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/${vehicleId}?start=${startDate.toISOString()}&end=${endDate.toISOString()}&bookingId=${booking.id}`,
    });

    console.log("✅ Session Stripe créée:", session.id);

    // 6. Mettre à jour le paiement avec le session ID
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      console.error("❌ Erreur lors de la mise à jour du paiement:", updatePaymentError);
      // On continue quand même car la session Stripe est créée
    }

    return {
      success: true,
      customerId,
      bookingId: booking.id,
      checkoutUrl: session.url || undefined,
    };
  } catch (error) {
    console.error("❌ Erreur inattendue:", error);
    return {
      success: false,
      error: "Une erreur inattendue s'est produite. Veuillez réessayer.",
    };
  }
}
