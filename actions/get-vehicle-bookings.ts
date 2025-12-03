"use server";

import { createClient } from "@/lib/supabase/server";

export interface VehicleBooking {
  start_date: string;
  end_date: string;
  status: string;
}

/**
 * Récupère toutes les réservations actives pour un véhicule donné
 * @param vehicleId - ID du véhicule
 * @returns Liste des réservations avec start_date, end_date et status
 */
export async function getVehicleBookings(
  vehicleId: string
): Promise<VehicleBooking[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookings")
      .select("start_date, end_date, status")
      .eq("vehicle_id", vehicleId);

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
 * @param vehicleIds - Liste des IDs de véhicules
 * @returns Map avec vehicleId comme clé et liste de bookings comme valeur
 */
export async function getMultipleVehiclesBookings(
  vehicleIds: string[]
): Promise<Map<string, VehicleBooking[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookings")
      .select("vehicle_id, start_date, end_date, status")
      .in("vehicle_id", vehicleIds);

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
