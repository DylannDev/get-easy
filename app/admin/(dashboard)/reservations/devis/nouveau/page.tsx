import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { BackLink } from "@/components/admin/shared/back-link";
import { NewBookingWizard } from "@/components/admin/reservations/new-booking-wizard";
import { getContainer } from "@/composition-root/container";

/**
 * Génération d'un devis — réutilise le wizard à 4 étapes en mode "quote".
 * Le wizard produit un PDF téléchargeable et une ligne dans `documents`
 * (type "quote") au lieu de créer une réservation.
 *
 * `?from=documents` est respecté côté wizard (post-génération) et côté
 * BackLink (retour utilisateur).
 */
interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function NewQuotePage({ searchParams }: PageProps) {
  const { from } = await searchParams;
  const fromDocuments = from === "documents";
  const backHref = fromDocuments
    ? "/admin/documents?tab=quote"
    : "/admin/reservations";
  const backLabel = fromDocuments ? "Documents" : "Réservations";

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
        <BackLink href={backHref} label={backLabel} />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
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
