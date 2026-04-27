import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/admin/shared/booking-status-badge";
import { getContainer } from "@/composition-root/container";
import { formatDateCayenne } from "@/lib/format-date";
import { BackLink } from "@/components/admin/shared/back-link";
import { LoadingLink } from "@/components/admin/shared/loading-link";
import { CustomerDocumentsSection } from "@/components/admin/customer-documents/customer-documents-section";
import { CustomerActions } from "@/components/admin/clients/customer-actions";
import { getCountryName } from "@/lib/countries";

interface Props {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerDetailPage({ params }: Props) {
  const { customerId } = await params;
  const {
    customerRepository,
    bookingRepository,
    customerDocumentRepository,
  } = getContainer();

  const customer = await customerRepository.findById(customerId);
  if (!customer) notFound();

  const [{ data: bookings }, customerDocuments] = await Promise.all([
    bookingRepository.findAllWithDetails({
      page: 1,
      pageSize: 50,
      search: customer.email,
      sort: { field: "created_at", direction: "desc" },
    }),
    customerDocumentRepository.listByCustomer(customerId),
  ]);

  return (
    <>
      <AdminHeader>
        <BackLink href="/admin/clients" label="Clients" />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        <PageHeader
          title={`${customer.firstName} ${customer.lastName}`}
          action={
            <CustomerActions
              customerId={customer.id}
              customerName={`${customer.firstName} ${customer.lastName}`}
            />
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Infos entreprise (uniquement si client pro) */}
          {customer.companyName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entreprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Raison sociale" value={customer.companyName} />
                {customer.siret && (
                  <Row label="N° SIRET" value={customer.siret} />
                )}
                {customer.vatNumber && (
                  <Row label="N° TVA intracom." value={customer.vatNumber} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Infos personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {customer.companyName
                  ? "Contact / Conducteur désigné"
                  : "Informations personnelles"}
              </CardTitle>
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
              <Row
                label="Pays"
                value={getCountryName(customer.country) ?? customer.country}
              />
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
                    <Row
                      label="Pays de délivrance"
                      value={
                        getCountryName(customer.driverLicenseCountry) ??
                        customer.driverLicenseCountry
                      }
                    />
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Non renseigné</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pièces justificatives — toujours rendu pour exposer le bouton
            "+ Importer des pièces" à l'admin (même si liste vide). */}
        <CustomerDocumentsSection
          documents={customerDocuments}
          context={{ customerId }}
          title="Pièces justificatives"
        />

        {/* Historique réservations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Historique des réservations ({bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 sm:p-6">
                Aucune réservation.
              </p>
            ) : (
              <div className="divide-y">
                {bookings.map((b) => (
                  <LoadingLink
                    key={b.id}
                    href={`/admin/reservations/${b.id}`}
                    className="flex flex-col gap-2 px-4 sm:px-6 py-3 hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                      <BookingStatusBadge status={b.status} />
                      <div className="text-sm flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="font-medium">
                          {b.vehicleBrand} {b.vehicleModel}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDateCayenne(b.startDate, "dd MMM")} → {formatDateCayenne(b.endDate, "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(b.totalPrice)} €
                    </span>
                  </LoadingLink>
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
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={`break-words sm:text-right font-medium ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
