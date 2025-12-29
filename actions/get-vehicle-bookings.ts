"use server";

import { createClient } from "@/lib/supabase/server";

export interface VehicleBooking {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
}

/**
 * Récupère toutes les réservations actives pour un véhicule donné
 * Ne retourne que les réservations "paid" ou "pending_payment" dont la date de fin n'est pas dépassée
 *
 * @param vehicleId - ID du véhicule
 * @returns Liste des réservations avec start_date, end_date et status
 */
export async function getVehicleBookings(
  vehicleId: string
): Promise<VehicleBooking[]> {
  try {
    const supabase = await createClient();

    // Récupère uniquement les bookings paid ou pending_payment
    // et exclut les bookings passés (end_date < NOW())
    const { data, error } = await supabase
      .from("bookings")
      .select("id, start_date, end_date, status")
      .eq("vehicle_id", vehicleId)
      .in("status", ["paid", "pending_payment"])
      .gte("end_date", new Date().toISOString());

    if (error) {
      console.error("❌ Erreur lors de la récupération des bookings:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Erreur inattendue:", error);
    return [];
  }
}

/**
 * Récupère toutes les réservations actives pour plusieurs véhicules
 * Ne retourne que les réservations "paid" ou "pending_payment" dont la date de fin n'est pas dépassée
 *
 * @param vehicleIds - Liste des IDs de véhicules
 * @returns Map avec vehicleId comme clé et liste de bookings comme valeur
 */
export async function getMultipleVehiclesBookings(
  vehicleIds: string[]
): Promise<Map<string, VehicleBooking[]>> {
  try {
    const supabase = await createClient();

    // Récupère uniquement les bookings paid ou pending_payment
    // et exclut les bookings passés (end_date < NOW())
    const { data, error } = await supabase
      .from("bookings")
      .select("id, vehicle_id, start_date, end_date, status")
      .in("vehicle_id", vehicleIds)
      .in("status", ["paid", "pending_payment"])
      .gte("end_date", new Date().toISOString());

    if (error) {
      console.error("❌ Erreur lors de la récupération des bookings:", error);
      return new Map();
    }

    // Grouper les bookings par vehicle_id
    const bookingsMap = new Map<string, VehicleBooking[]>();

    data?.forEach((booking) => {
      const vehicleId = booking.vehicle_id;
      if (!bookingsMap.has(vehicleId)) {
        bookingsMap.set(vehicleId, []);
      }
      bookingsMap.get(vehicleId)!.push({
        id: booking.id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        status: booking.status,
      });
    });

    return bookingsMap;
  } catch (error) {
    console.error("❌ Erreur inattendue:", error);
    return new Map();
  }
}
