import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { BackLink } from "@/components/admin/shared/back-link";
import { NewBookingWizard } from "@/components/admin/reservations/new-booking-wizard";
import { getContainer } from "@/composition-root/container";

/**
 * Génération d'un devis — réutilise le wizard à 4 étapes en mode "quote".
 * Le wizard produit un PDF téléchargeable et une ligne dans `documents`
 * (type "quote") au lieu de créer une réservation.
 */
export default async function NewQuotePage() {
  const {
    vehicleRepository,
    agencyRepository,
    bookingRepository,
    customerRepository,
    listOptionsUseCase,
  } = getContainer();
  const [vehicles, agencies, customersPage] = await Promise.all([
    vehicleRepository.findAll(),
    agencyRepository.findAll(),
    customerRepository.findAll({ page: 1, pageSize: 500 }),
  ]);
  const existingCustomers = customersPage.data.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    birthDate: c.birthDate,
    address: c.address,
    postalCode: c.postalCode,
    city: c.city,
    country: c.country,
  }));

  const optionsByAgency: Record<
    string,
    Awaited<ReturnType<typeof listOptionsUseCase.execute>>
  > = {};
  await Promise.all(
    agencies.map(async (agency) => {
      const all = await listOptionsUseCase.execute(agency.id);
      optionsByAgency[agency.id] = all.filter((o) => o.active);
    })
  );

  const vehicleIds = vehicles.map((v) => v.id);
  const bookingsMap =
    await bookingRepository.findActiveAvailabilityViewsByVehicleIds(vehicleIds);
  const bookingsByVehicle = Object.fromEntries(bookingsMap);

  return (
    <>
      <AdminHeader>
        <BackLink href="/admin/reservations" label="Réservations" />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6 overflow-y-auto">
        <PageHeader
          title="Générer un devis"
          description="Sélectionnez un véhicule, des options et un client. Un PDF daté et numéroté sera téléchargeable à la fin."
        />
        <NewBookingWizard
          mode="quote"
          vehicles={vehicles}
          agencies={agencies}
          optionsByAgency={optionsByAgency}
          bookingsByVehicle={bookingsByVehicle}
          existingCustomers={existingCustomers}
        />
      </div>
    </>
  );
}
