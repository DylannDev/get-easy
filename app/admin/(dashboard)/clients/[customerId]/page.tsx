import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/admin/shared/booking-status-badge";
import { getContainer } from "@/composition-root/container";
import { formatDateCayenne } from "@/lib/format-date";
import Link from "next/link";
import { BackLink } from "@/components/admin/shared/back-link";

interface Props {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerDetailPage({ params }: Props) {
  const { customerId } = await params;
  const { customerRepository, bookingRepository } = getContainer();

  const customer = await customerRepository.findById(customerId);
  if (!customer) notFound();

  const { data: bookings } = await bookingRepository.findAllWithDetails({
    page: 1,
    pageSize: 50,
    search: customer.email,
    sort: { field: "created_at", direction: "desc" },
  });

  return (
    <>
      <AdminHeader>
        <BackLink href="/admin/clients" label="Clients" />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6 overflow-y-auto">
        <PageHeader
          title={`${customer.firstName} ${customer.lastName}`}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Infos personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Nom" value={`${customer.firstName} ${customer.lastName}`} capitalize />
              <Row label="Email" value={customer.email} />
              <Row label="Téléphone" value={customer.phone} />
              <Row label="Date de naissance" value={formatDateCayenne(customer.birthDate, "dd MMMM yyyy")} />
              {customer.birthPlace && <Row label="Lieu de naissance" value={customer.birthPlace} />}
              <Row label="Adresse" value={customer.address} />
              {customer.address2 && <Row label="Adresse 2" value={customer.address2} />}
              <Row label="Ville" value={`${customer.postalCode} ${customer.city}`} />
              <Row label="Pays" value={customer.country} />
              <Row label="Inscrit le" value={formatDateCayenne(customer.createdAt, "dd MMMM yyyy")} />
            </CardContent>
          </Card>

          {/* Permis de conduire */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permis de conduire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {customer.driverLicenseNumber ? (
                <>
                  <Row label="Numéro" value={customer.driverLicenseNumber} />
                  {customer.driverLicenseIssuedAt && (
                    <Row label="Délivré le" value={formatDateCayenne(customer.driverLicenseIssuedAt, "dd MMMM yyyy")} />
                  )}
                  {customer.driverLicenseCountry && (
                    <Row label="Pays de délivrance" value={customer.driverLicenseCountry} />
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Non renseigné</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Historique réservations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Historique des réservations ({bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6">
                Aucune réservation.
              </p>
            ) : (
              <div className="divide-y">
                {bookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/reservations/${b.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <BookingStatusBadge status={b.status} />
                      <div className="text-sm">
                        <span className="font-medium">
                          {b.vehicleBrand} {b.vehicleModel}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {formatDateCayenne(b.startDate, "dd MMM")} → {formatDateCayenne(b.endDate, "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(b.totalPrice)} €
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}
