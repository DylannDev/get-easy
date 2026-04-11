import { AdminHeader } from "@/components/admin/admin-header";
import { VehiclesPageContent } from "@/components/admin/vehicles/vehicles-page-content";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";

export default async function VehiclesPage() {
  const agencyId = await getActiveAgency();
  const { vehicleRepository } = getContainer();
  const vehicles = await vehicleRepository.findByAgencyId(agencyId);

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Véhicules</span>
      </AdminHeader>
      <VehiclesPageContent vehicles={vehicles} />
    </>
  );
}
