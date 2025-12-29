import { SearchForm } from "./search-form";
import { getAllAgencies } from "@/lib/supabase/queries";
import { mapVehicleFromDB } from "@/lib/supabase/mappers";
import { getMultipleVehiclesBookings } from "@/actions/get-vehicle-bookings";
import type { Agency } from "@/types";

export async function SearchFormWrapper() {
  // Récupérer toutes les agences depuis Supabase
  const dbAgencies = await getAllAgencies();

  // Pour chaque agence, récupérer ses véhicules
  const agencies: Agency[] = await Promise.all(
    dbAgencies.map(async (dbAgency) => {
      // Import dynamique pour éviter les problèmes de dépendances circulaires
      const { getVehiclesByAgencyId } = await import("@/lib/supabase/queries");
      const vehicles = await getVehiclesByAgencyId(dbAgency.id);

      return {
        id: dbAgency.id,
        name: dbAgency.name,
        city: dbAgency.city,
        address: dbAgency.address,
        hours: {
          openTime: dbAgency.open_time,
          closeTime: dbAgency.close_time,
          interval: dbAgency.interval,
        },
        vehicles: vehicles.map((v) => mapVehicleFromDB(v)),
      };
    })
  );

  // Récupérer tous les bookings pour tous les véhicules
  const allVehicles = agencies.flatMap((agency) => agency.vehicles);
  const vehicleIds = allVehicles.map((v) => v.id);
  const bookingsMap = await getMultipleVehiclesBookings(vehicleIds);

  return <SearchForm agencies={agencies} bookingsMap={bookingsMap} />;
}
