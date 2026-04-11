import { notFound } from "next/navigation";
import { VehicleFormPage } from "@/components/admin/vehicles/vehicle-form-page";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";
import { listStorageImages } from "@/actions/admin/list-storage-images";

interface Props {
  params: Promise<{ vehicleId: string }>;
}

export default async function VehicleDetailPage({ params }: Props) {
  const { vehicleId } = await params;
  const { vehicleRepository } = getContainer();

  const vehicle = await vehicleRepository.findById(vehicleId);
  if (!vehicle) notFound();

  const [agencyId, storageImages] = await Promise.all([
    getActiveAgency(),
    listStorageImages(),
  ]);

  return (
    <VehicleFormPage
      vehicle={vehicle}
      agencyId={agencyId}
      existingImages={storageImages}
      title={`${vehicle.brand} ${vehicle.model}`}
    />
  );
}
