import { SearchForm } from "./search-form";
import { getAllAgencies } from "@/lib/supabase/queries";
import { mapVehicleFromDB } from "@/lib/supabase/mappers";
import type { Agency } from "@/types";

// Mapping des URLs d'images (temporaire, à remplacer par les vraies images)
const VEHICLE_IMAGE_URLS: Record<string, string> = {
  // Les IDs seront générés par Supabase, donc on utilisera l'image par défaut
  default: "/vehicles/clio-grise.png",
};

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
        vehicles: vehicles.map((v) =>
          mapVehicleFromDB(
            v,
            VEHICLE_IMAGE_URLS[v.id] || VEHICLE_IMAGE_URLS.default
          )
        ),
      };
    })
  );

  return <SearchForm agencies={agencies} />;
}
