import { AdminHeader } from "@/components/admin/admin-header";
import { BackLink } from "@/components/admin/shared/back-link";
import { NewBookingWizard } from "@/components/admin/reservations/new-booking-wizard";
import { getContainer } from "@/composition-root/container";

export default async function NewBookingPage() {
  const { vehicleRepository, agencyRepository, listOptionsUseCase } =
    getContainer();
  const [vehicles, agencies] = await Promise.all([
    vehicleRepository.findAll(),
    agencyRepository.findAll(),
  ]);

  // Charge les options (actives) pour chaque agence en une passe
  const optionsByAgency: Record<string, Awaited<
    ReturnType<typeof listOptionsUseCase.execute>
  >> = {};
  await Promise.all(
    agencies.map(async (agency) => {
      const all = await listOptionsUseCase.execute(agency.id);
      optionsByAgency[agency.id] = all.filter((o) => o.active);
    })
  );

  return (
    <>
      <AdminHeader>
        <BackLink href="/admin/reservations" label="Réservations" />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6 overflow-y-auto">
        <NewBookingWizard
          vehicles={vehicles}
          agencies={agencies}
          optionsByAgency={optionsByAgency}
        />
      </div>
    </>
  );
}
