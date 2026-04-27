import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { BackLink } from "@/components/admin/shared/back-link";
import { NewBookingWizard } from "@/components/admin/reservations/new-booking-wizard";
import { getContainer } from "@/composition-root/container";

export default async function NewBookingPage() {
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
    birthPlace: c.birthPlace,
    address: c.address,
    address2: c.address2,
    postalCode: c.postalCode,
    city: c.city,
    country: c.country,
    driverLicenseNumber: c.driverLicenseNumber,
    driverLicenseIssuedAt: c.driverLicenseIssuedAt,
    driverLicenseCountry: c.driverLicenseCountry,
    companyName: c.companyName,
    siret: c.siret,
    vatNumber: c.vatNumber,
  }));

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

  // Batch : toutes les résas actives par véhicule — sert au filtrage
  // client-side de la liste de véhicules dès que les dates sont posées.
  const vehicleIds = vehicles.map((v) => v.id);
  const bookingsMap =
    await bookingRepository.findActiveAvailabilityViewsByVehicleIds(vehicleIds);
  const bookingsByVehicle = Object.fromEntries(bookingsMap);

  return (
    <>
      <AdminHeader>
        <BackLink href="/admin/reservations" label="Réservations" />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        <PageHeader
          title="Nouvelle réservation"
          description="Sélectionnez un véhicule, des options et un client pour créer une réservation."
        />
        <NewBookingWizard
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
