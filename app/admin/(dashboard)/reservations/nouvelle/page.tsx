import { AdminHeader } from "@/components/admin/admin-header";
import { BackLink } from "@/components/admin/shared/back-link";
import { NewBookingWizard } from "@/components/admin/reservations/new-booking-wizard";
import { getContainer } from "@/composition-root/container";

export default async function NewBookingPage() {
  const { vehicleRepository, agencyRepository } = getContainer();
  const [vehicles, agencies] = await Promise.all([
    vehicleRepository.findAll(),
    agencyRepository.findAll(),
  ]);

  return (
    <>
      <AdminHeader>
        <BackLink href="/admin/reservations" label="Réservations" />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6">
        <NewBookingWizard vehicles={vehicles} agencies={agencies} />
      </div>
    </>
  );
}
