import { notFound } from "next/navigation";
import { formatDateCayenne } from "@/lib/format-date";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { BookingStatusBadge } from "@/components/admin/shared/booking-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContainer } from "@/composition-root/container";
import { BackLink } from "@/components/admin/shared/back-link";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function BookingDetailPage({ params }: Props) {
  const { bookingId } = await params;
  const { bookingRepository, customerRepository, vehicleRepository } =
    getContainer();

  const booking = await bookingRepository.findById(bookingId);
  if (!booking) notFound();

  const [customer, vehicle] = await Promise.all([
    customerRepository.findById(booking.customerId),
    vehicleRepository.findById(booking.vehicleId),
  ]);

  return (
    <>
      <AdminHeader>
        <BackLink href="/admin/reservations" label="Réservations" />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-3">
          <PageHeader title="Détail de la réservation" />
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Infos réservation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Réservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Référence" value={booking.id} mono />
              <Row
                label="Départ"
                value={formatDateCayenne(booking.startDate, "dd MMMM yyyy 'à' HH'h'mm")}
              />
              <Row
                label="Retour"
                value={formatDateCayenne(booking.endDate, "dd MMMM yyyy 'à' HH'h'mm")}
              />
              <Row
                label="Total"
                value={`${Math.round(booking.totalPrice)} €`}
              />
              <Row
                label="Créée le"
                value={formatDateCayenne(booking.createdAt, "dd MMMM yyyy 'à' HH'h'mm")}
              />
            </CardContent>
          </Card>

          {/* Infos client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {customer ? (
                <>
                  <Row
                    label="Nom"
                    value={`${customer.firstName} ${customer.lastName}`}
                    capitalize
                  />
                  <Row label="Email" value={customer.email} />
                  <Row label="Téléphone" value={customer.phone} />
                  <Row
                    label="Adresse"
                    value={`${customer.address}, ${customer.postalCode} ${customer.city}`}
                  />
                  {customer.driverLicenseNumber && (
                    <Row
                      label="Permis"
                      value={customer.driverLicenseNumber}
                    />
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Client non trouvé</p>
              )}
            </CardContent>
          </Card>

          {/* Infos véhicule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Véhicule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {vehicle ? (
                <>
                  <Row
                    label="Véhicule"
                    value={`${vehicle.brand} ${vehicle.model}`}
                  />
                  <Row label="Couleur" value={vehicle.color} />
                  <Row label="Immatriculation" value={vehicle.registrationPlate} />
                  <Row label="Transmission" value={vehicle.transmission} capitalize />
                  <Row label="Carburant" value={vehicle.fuelType} capitalize />
                </>
              ) : (
                <p className="text-muted-foreground">Véhicule non trouvé</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-medium ${mono ? "font-mono text-xs" : ""} ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
