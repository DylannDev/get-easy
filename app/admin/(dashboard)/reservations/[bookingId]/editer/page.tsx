import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { BackLink } from "@/components/admin/shared/back-link";
import { NewBookingWizard } from "@/components/admin/reservations/new-booking-wizard";
import { getContainer } from "@/composition-root/container";
import { BookingStatus } from "@/domain/booking";
import type { InitialBookingData } from "@/components/admin/reservations/new-booking-wizard";

interface Props {
  params: Promise<{ bookingId: string }>;
}

const EDITABLE_STATUSES: BookingStatus[] = [
  BookingStatus.Paid,
  BookingStatus.PendingPayment,
];

export default async function EditBookingPage({ params }: Props) {
  const { bookingId } = await params;

  const {
    bookingRepository,
    customerRepository,
    vehicleRepository,
    agencyRepository,
    optionRepository,
    listOptionsUseCase,
  } = getContainer();

  const booking = await bookingRepository.findById(bookingId);
  if (!booking) notFound();
  if (!EDITABLE_STATUSES.includes(booking.status)) notFound();

  const [customer, vehicles, agencies, bookingOptions] = await Promise.all([
    customerRepository.findById(booking.customerId),
    vehicleRepository.findAll(),
    agencyRepository.findAll(),
    optionRepository.listForBooking(booking.id),
  ]);

  if (!customer) notFound();

  // Options actives par agence (même pattern que /reservations/nouvelle)
  const optionsByAgency: Record<string, Awaited<
    ReturnType<typeof listOptionsUseCase.execute>
  >> = {};
  await Promise.all(
    agencies.map(async (agency) => {
      const all = await listOptionsUseCase.execute(agency.id);
      optionsByAgency[agency.id] = all.filter((o) => o.active);
    })
  );

  // Résas actives par véhicule — pour filtrer la liste de véhicules
  // par dispo à l'étape 1. La résa en cours d'édition est exclue côté
  // wizard via `allowExcludingPaid: true` + `excludeBookingId`.
  const vehicleIds = vehicles.map((v) => v.id);
  const bookingsMap =
    await bookingRepository.findActiveAvailabilityViewsByVehicleIds(vehicleIds);
  const bookingsByVehicle = Object.fromEntries(bookingsMap);

  // Sélection pré-remplie depuis les booking_options existants.
  const selectedOptions: Record<string, number> = {};
  for (const bo of bookingOptions) {
    selectedOptions[bo.optionId] = bo.quantity;
  }

  const initialBooking: InitialBookingData = {
    bookingId: booking.id,
    startDate: new Date(booking.startDate),
    endDate: new Date(booking.endDate),
    vehicleId: booking.vehicleId,
    agencyId: booking.agencyId,
    customer: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      birthDate: customer.birthDate,
      address: customer.address,
      postalCode: customer.postalCode,
      city: customer.city,
      country: customer.country,
    },
    selectedOptions,
  };

  return (
    <>
      <AdminHeader>
        <BackLink
          href={`/admin/reservations/${booking.id}`}
          label="Détail de la réservation"
        />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6 overflow-y-auto">
        <NewBookingWizard
          vehicles={vehicles}
          agencies={agencies}
          optionsByAgency={optionsByAgency}
          bookingsByVehicle={bookingsByVehicle}
          initialBooking={initialBooking}
        />
      </div>
    </>
  );
}
