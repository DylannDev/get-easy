import { VehicleFormPage } from "@/components/admin/vehicles/vehicle-form-page";
import { getActiveAgency } from "@/lib/admin/get-active-agency";
import { listStorageImages } from "@/actions/admin/list-storage-images";

export default async function NewVehiclePage() {
  const [agencyId, storageImages] = await Promise.all([
    getActiveAgency(),
    listStorageImages(),
  ]);

  return (
    <VehicleFormPage
      agencyId={agencyId}
      existingImages={storageImages}
      title="Nouveau véhicule"
    />
  );
}
