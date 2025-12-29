"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { filterOutCurrentBooking } from "@/lib/availability";

interface CheckVehicleAvailabilityParams {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  excludeBookingId?: string; // ID du booking à exclure (le booking courant de l'utilisateur)
}

interface CheckVehicleAvailabilityResult {
  available: boolean;
  conflictStart?: string;
  conflictEnd?: string;
  conflictStatus?: "blocked_period" | "paid" | "pending_payment";
}

interface BlockedPeriod {
  start: string;
  end: string;
}

interface Booking {
  id?: string;
  start_date: string;
  end_date: string;
  status: string;
}

/**
 * Vérifie si un véhicule est disponible pour une période donnée
 * Vérifie les blocked_periods ET les bookings actifs (paid ou pending_payment)
 * Retourne les dates du conflit pour afficher un message détaillé
 *
 * Cette fonction réutilise la même logique que rangeOverlapsBlockedPeriod dans useBookingSummary
 *
 * @param params - vehicleId, startDate, endDate, excludeBookingId (optionnel)
 * @returns { available, conflictStart?, conflictEnd?, conflictStatus? }
 */
export async function checkVehicleAvailability({
  vehicleId,
  startDate,
  endDate,
  excludeBookingId,
}: CheckVehicleAvailabilityParams): Promise<CheckVehicleAvailabilityResult> {
  try {
    const supabase = createAdminClient();

    // 1. Récupérer les blocked_periods depuis la table blocked_periods
    const { data: blockedPeriods, error: blockedPeriodsError } = await supabase
      .from("blocked_periods")
      .select("start, end")
      .eq("vehicle_id", vehicleId);

    if (blockedPeriodsError) {
      // En cas d'erreur, on considère le véhicule comme disponible
      // Le webhook Stripe fera la vérification finale
      return { available: true };
    }

    // 2. Récupérer les bookings actifs (paid ou pending_payment, end_date >= NOW)
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, start_date, end_date, status")
      .eq("vehicle_id", vehicleId)
      .in("status", ["paid", "pending_payment"])
      .gte("end_date", new Date().toISOString());

    if (bookingsError) {
      // En cas d'erreur, on considère le véhicule comme disponible
      // Le webhook Stripe fera la vérification finale
      return { available: true };
    }

    // 3. Filtrer les bookings pour exclure le booking courant
    const filteredBookings = filterOutCurrentBooking(
      (bookings as Booking[]) || [],
      excludeBookingId
    );

    // 4. Normaliser les dates demandées à la journée
    const normalizedStart = new Date(startDate);
    const normalizedEnd = new Date(endDate);
    normalizedStart.setHours(0, 0, 0, 0);
    normalizedEnd.setHours(0, 0, 0, 0);

    // 5. Vérifier les blocked_periods du véhicule
    for (const blocked of (blockedPeriods as BlockedPeriod[]) || []) {
      let blockedStart = new Date(blocked.start);
      let blockedEnd = new Date(blocked.end);

      // Corrige les périodes inversées
      if (blockedStart > blockedEnd) {
        [blockedStart, blockedEnd] = [blockedEnd, blockedStart];
      }

      const normalizedBlockedStart = new Date(blockedStart);
      const normalizedBlockedEnd = new Date(blockedEnd);
      normalizedBlockedStart.setHours(0, 0, 0, 0);
      normalizedBlockedEnd.setHours(0, 0, 0, 0);

      // Vérifie le chevauchement
      if (
        normalizedStart <= normalizedBlockedEnd &&
        normalizedEnd >= normalizedBlockedStart
      ) {
        return {
          available: false,
          conflictStart: blockedStart.toISOString(),
          conflictEnd: blockedEnd.toISOString(),
          conflictStatus: "blocked_period",
        };
      }
    }

    // 6. Vérifier les bookings actifs (paid ou pending_payment)
    // Utiliser filteredBookings qui exclut le booking courant
    for (const booking of filteredBookings) {
      if (!["paid", "pending_payment"].includes(booking.status)) {
        continue;
      }

      let bookingStart = new Date(booking.start_date);
      let bookingEnd = new Date(booking.end_date);

      // Corrige les périodes inversées
      if (bookingStart > bookingEnd) {
        [bookingStart, bookingEnd] = [bookingEnd, bookingStart];
      }

      const normalizedBookingStart = new Date(bookingStart);
      const normalizedBookingEnd = new Date(bookingEnd);
      normalizedBookingStart.setHours(0, 0, 0, 0);
      normalizedBookingEnd.setHours(0, 0, 0, 0);

      // Vérifie le chevauchement
      if (
        normalizedStart <= normalizedBookingEnd &&
        normalizedEnd >= normalizedBookingStart
      ) {
        return {
          available: false,
          conflictStart: bookingStart.toISOString(),
          conflictEnd: bookingEnd.toISOString(),
          conflictStatus: booking.status as "paid" | "pending_payment",
        };
      }
    }

    // 7. Aucun conflit détecté
    return { available: true };
  } catch {
    // En cas d'erreur, on considère le véhicule comme disponible
    // Le webhook Stripe fera la vérification finale
    return { available: true };
  }
}
