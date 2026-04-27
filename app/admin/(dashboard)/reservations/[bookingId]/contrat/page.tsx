import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { BackLink } from "@/components/admin/shared/back-link";
import { getContainer } from "@/composition-root/container";
import { ContractEditor } from "@/components/admin/contracts/contract-editor";
import { buildDefaultContractFields } from "@/application/admin/documents/generate-contract.use-case";
import { computeBilledDays, getApplicablePricePerDay } from "@/domain/vehicle";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function EditContractPage({ params }: Props) {
  const { bookingId } = await params;
  const {
    bookingRepository,
    customerRepository,
    vehicleRepository,
    agencyRepository,
    optionRepository,
    contractFieldsRepository,
    listDocumentsUseCase,
  } = getContainer();

  const booking = await bookingRepository.findById(bookingId);
  if (!booking) notFound();

  const [customer, vehicle, agency, options, existingFields, bookingDocs] =
    await Promise.all([
      customerRepository.findById(booking.customerId),
      vehicleRepository.findById(booking.vehicleId),
      agencyRepository.findById(booking.agencyId),
      optionRepository.listForBooking(booking.id),
      contractFieldsRepository.findByBooking(booking.id),
      listDocumentsUseCase.byBooking(booking.id),
    ]);

  if (!customer || !vehicle || !agency) notFound();

  // Self-healing : si aucun PDF de contrat n'existe (supprimé, ou jamais
  // généré), les éventuels champs + signatures orphelins sont effacés pour
  // que l'utilisateur reparte d'une ardoise vierge. Couvre les cas legacy
  // (contrat supprimé avant que la cascade auto ne soit en place).
  const hasContractPdf = bookingDocs.some((d) => d.type === "contract");
  let contractFields = existingFields;
  if (!hasContractPdf && existingFields) {
    await contractFieldsRepository.deleteByBooking(booking.id);
    contractFields = null;
  }

  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const numberOfDays = Math.max(1, computeBilledDays(startDate, endDate));

  // Prix/jour figé depuis le total payé moins options (cf. facture)
  const optionsTotalSnapshot = options.reduce((acc, bo) => {
    const line =
      bo.priceTypeSnapshot === "per_day"
        ? bo.unitPriceSnapshot * bo.quantity * numberOfDays
        : bo.unitPriceSnapshot * bo.quantity;
    return acc + line;
  }, 0);
  const vehicleTotal = Math.max(0, booking.totalPrice - optionsTotalSnapshot);
  const pricePerDay =
    numberOfDays > 0
      ? vehicleTotal / numberOfDays
      : getApplicablePricePerDay(1, vehicle.pricingTiers, vehicle.pricePerDay);

  const defaults = buildDefaultContractFields({
    customer: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      birthDate: customer.birthDate,
      birthPlace: customer.birthPlace,
      address: customer.address,
      postalCode: customer.postalCode,
      city: customer.city,
      country: customer.country,
      phone: customer.phone,
      email: customer.email,
      driverLicenseNumber: customer.driverLicenseNumber,
      driverLicenseIssuedAt: customer.driverLicenseIssuedAt,
    },
    vehicle: {
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      registrationPlate: vehicle.registrationPlate,
      fiscalPower: vehicle.fiscalPower ?? null,
    },
    agency: { city: agency.city },
    startDate,
    endDate,
    numberOfDays,
    pricePerDay,
    totalPrice: booking.totalPrice,
  });

  // Fusion : valeurs sauvegardées prioritaires, défauts en fallback.
  const initialFields = {
    ...defaults,
    ...(contractFields?.fields ?? {}),
  };

  return (
    <>
      <AdminHeader>
        <BackLink
          href={`/admin/reservations/${bookingId}`}
          label="Détail de la réservation"
        />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        <PageHeader
          title="Éditer le contrat de location"
          description="Les champs sont pré-remplis depuis la réservation. Modifiez-les si nécessaire avant d'enregistrer et de générer le PDF."
        />
        <ContractEditor
          bookingId={bookingId}
          agency={{
            name: agency.name,
            legalForm: agency.legalForm ?? null,
            capitalSocial: agency.capitalSocial ?? null,
            address: agency.address,
            postalCode: agency.postalCode ?? null,
            city: agency.city,
            country: agency.country ?? null,
            rcsCity: agency.rcsCity ?? null,
            rcsNumber: agency.rcsNumber ?? null,
            siret: agency.siret ?? null,
            phone: agency.phone ?? null,
            email: agency.email ?? null,
          }}
          initialFields={initialFields}
          initialSignatures={{
            customer: contractFields?.customerSignature ?? null,
            // Si pas de signature spécifique à ce contrat, on retombe sur
            // la signature / tampon par défaut de l'agence.
            loueur:
              contractFields?.loueurSignature ??
              agency.defaultLoueurSignature ??
              null,
          }}
          signedAt={contractFields?.signedAt ?? null}
        />
      </div>
    </>
  );
}
