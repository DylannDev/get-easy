import { notFound } from "next/navigation";
import { formatDateCayenne } from "@/lib/format-date";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { BookingStatusBadge } from "@/components/admin/shared/booking-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContainer } from "@/composition-root/container";
import { BackLink } from "@/components/admin/shared/back-link";
import { DocumentsContent } from "@/components/admin/documents/documents-content";
import { CustomerDocumentsSection } from "@/components/admin/customer-documents/customer-documents-section";
import { GenerateInvoiceButton } from "@/components/admin/documents/generate-invoice-button";
import { GenerateContractButton } from "@/components/admin/documents/generate-contract-button";
import { BookingStatus } from "@/domain/booking";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PiPencilSimple } from "react-icons/pi";
import { InspectionSection } from "@/components/admin/inspection/inspection-section";
import type { InspectionType } from "@/domain/inspection";
import { SendDocumentsButton } from "@/components/admin/reservations/send-documents-button";
import type { DocumentOption } from "@/components/admin/reservations/send-documents-dialog";
import { BookingStatusChangeButton } from "@/components/admin/reservations/booking-status-change-button";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function BookingDetailPage({ params }: Props) {
  const { bookingId } = await params;
  const {
    bookingRepository,
    customerRepository,
    vehicleRepository,
    listDocumentsUseCase,
    contractFieldsRepository,
    customerDocumentRepository,
    inspectionRepository,
  } = getContainer();

  const booking = await bookingRepository.findById(bookingId);
  if (!booking) notFound();

  const [customer, vehicle, documents, contractFields, customerDocuments] =
    await Promise.all([
      customerRepository.findById(booking.customerId),
      vehicleRepository.findById(booking.vehicleId),
      listDocumentsUseCase.byBooking(bookingId),
      contractFieldsRepository.findByBooking(bookingId),
      customerDocumentRepository.listByBooking(bookingId),
    ]);

  // Charge les rapports d'inspection (départ + retour) avec les photos
  // et leurs URLs signées pré-résolues pour le composant client.
  const inspectionTypes: InspectionType[] = ["departure", "return"];
  const inspectionData = await Promise.all(
    inspectionTypes.map(async (type) => {
      const report = await inspectionRepository.findByBookingAndType(
        bookingId,
        type
      );
      if (!report) return { type, report: null, photos: [] };
      const photos = await inspectionRepository.listPhotos(report.id);
      const photosWithUrls = await Promise.all(
        photos.map(async (p) => ({
          ...p,
          signedUrl:
            (await inspectionRepository.getPhotoSignedUrl(p.id)) ?? "",
        }))
      );
      return { type, report, photos: photosWithUrls };
    })
  );
  const departureData = inspectionData.find((d) => d.type === "departure")!;
  const returnData = inspectionData.find((d) => d.type === "return")!;

  // Construit la liste des docs envoyables par email (facture, contrat,
  // EDL départ, EDL retour). Les EDL sont distingués via `inspectionReportId`.
  const sendableDocs: DocumentOption[] = [];
  const invoice = documents.find((d) => d.type === "invoice");
  if (invoice) sendableDocs.push({ id: invoice.id, label: "Facture" });
  const contract = documents.find((d) => d.type === "contract");
  if (contract) sendableDocs.push({ id: contract.id, label: "Contrat" });
  const departureDoc = documents.find(
    (d) =>
      d.type === "inspection" &&
      d.inspectionReportId === departureData.report?.id
  );
  if (departureDoc)
    sendableDocs.push({
      id: departureDoc.id,
      label: "État des lieux de départ",
    });
  const returnDoc = documents.find(
    (d) =>
      d.type === "inspection" && d.inspectionReportId === returnData.report?.id
  );
  if (returnDoc)
    sendableDocs.push({
      id: returnDoc.id,
      label: "État des lieux de retour",
    });

  return (
    <>
      <AdminHeader>
        <BackLink href="/admin/reservations" label="Réservations" />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <PageHeader title="Détail de la réservation" />
            <BookingStatusBadge status={booking.status} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            {booking.status === BookingStatus.Paid && customer && (
              <SendDocumentsButton
                bookingId={booking.id}
                defaultEmail={customer.email}
                options={sendableDocs}
              />
            )}
            <BookingStatusChangeButton
              bookingId={booking.id}
              currentStatus={booking.status}
            />
            {(booking.status === BookingStatus.Paid ||
              booking.status === BookingStatus.PendingPayment) && (
              <Link href={`/admin/reservations/${booking.id}/editer`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <PiPencilSimple className="size-4" />
                  Modifier la réservation
                </Button>
              </Link>
            )}
          </div>
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
                  {customer.companyName && (
                    <>
                      <Row label="Entreprise" value={customer.companyName} />
                      {customer.siret && (
                        <Row label="SIRET" value={customer.siret} />
                      )}
                      {customer.vatNumber && (
                        <Row label="N° TVA" value={customer.vatNumber} />
                      )}
                    </>
                  )}
                  <Row
                    label={customer.companyName ? "Conducteur" : "Nom"}
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

        {/* Pièces jointes client (upload public facultatif).
            Toujours rendu : si vide, l'admin voit le bouton "+ Importer". */}
        <CustomerDocumentsSection
          documents={customerDocuments}
          context={{ bookingId: booking.id }}
        />

        {/* Documents liés à la réservation */}
        <DocumentsContent
          documents={documents}
          bookingById={{ [booking.id]: booking }}
          bookingIdFilter={booking.id}
          headerExtra={
            booking.status === BookingStatus.Paid ? (
              <>
                <GenerateContractButton
                  bookingId={booking.id}
                  hasContract={documents.some((d) => d.type === "contract")}
                  isSigned={
                    !!contractFields?.signedAt &&
                    documents.some((d) => d.type === "contract")
                  }
                />
                <GenerateInvoiceButton
                  bookingId={booking.id}
                  hasInvoice={documents.some((d) => d.type === "invoice")}
                />
              </>
            ) : null
          }
        />

        {/* État des lieux (départ + retour) */}
        {booking.status === BookingStatus.Paid && (
          <InspectionSection
            bookingId={booking.id}
            agencyId={booking.agencyId}
            departure={departureData}
            returnInspection={returnData}
          />
        )}
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
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={`break-words sm:text-right font-medium ${mono ? "font-mono text-xs" : ""} ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
