import { SearchForm } from "./search-form";
import { getContainer } from "@/composition-root/container";
import type { Agency } from "@/domain/agency";

export async function SearchFormWrapper() {
  const { agencyRepository, vehicleRepository, bookingRepository } =
    getContainer();

  // 1. Charger toutes les agences (sans véhicules)
  const dbAgencies = await agencyRepository.findAll();

  // 2. Pour chaque agence, charger ses véhicules en parallèle
  const agencies: Agency[] = await Promise.all(
    dbAgencies.map(async (agency) => ({
      ...agency,
      vehicles: await vehicleRepository.findByAgencyId(agency.id),
    }))
  );

  // 3. Charger tous les bookings actifs en une seule requête
  const vehicleIds = agencies.flatMap((a) => a.vehicles.map((v) => v.id));
  const bookingsMap =
    await bookingRepository.findActiveAvailabilityViewsByVehicleIds(vehicleIds);

  return <SearchForm agencies={agencies} bookingsMap={bookingsMap} />;
}
