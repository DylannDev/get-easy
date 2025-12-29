"use server";

import { createAdminClient } from "@/lib/supabase/server";

interface CreateInitiatedBookingParams {
  vehicleId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

interface CreateInitiatedBookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
}

/**
 * Crée une réservation avec status="initiated" au moment du clic sur un véhicule
 * Cette réservation n'a pas de customer_id, expire après 2h, et n'affecte pas la disponibilité
 * Elle sera mise à jour vers "pending_payment" lors du submit du formulaire
 *
 * @param params - vehicleId, startDate (ISO), endDate (ISO)
 * @returns { success, bookingId?, error? }
 */
export async function createInitiatedBooking({
  vehicleId,
  startDate,
  endDate,
}: CreateInitiatedBookingParams): Promise<CreateInitiatedBookingResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Récupérer l'agencyId du véhicule
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("agency_id")
      .eq("id", vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      console.error("❌ Erreur lors de la récupération du véhicule:", vehicleError);
      return {
        success: false,
        error: "Véhicule introuvable.",
      };
    }

    // Créer une réservation initiale (sans customer, expiration à 2h)
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 heures
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        vehicle_id: vehicleId,
        agency_id: vehicle.agency_id,
        start_date: startDate,
        end_date: endDate,
        status: "initiated",
        total_price: 0, // Valeur temporaire, sera mise à jour lors du submit
        expires_at: expiresAt.toISOString(), // Expire après 2 heures
        // customer_id sera ajouté lors du submit (colonne nullable)
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error("❌ Erreur lors de la création du booking initiated:", bookingError);
      return {
        success: false,
        error: "Impossible de créer la réservation. Veuillez réessayer.",
      };
    }

    console.log("✅ Booking initiated créé:", booking.id);

    return {
      success: true,
      bookingId: booking.id,
    };
  } catch (error) {
    console.error("❌ Erreur inattendue:", error);
    return {
      success: false,
      error: "Une erreur inattendue s'est produite. Veuillez réessayer.",
    };
  }
}
