import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import type { EnrichedDocument } from "@/components/admin/documents/documents-content";
import { DocumentsTabbedView } from "@/components/admin/documents/documents-tabbed-view";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";

export default async function DocumentsPage() {
  const agencyId = await getActiveAgency();
  const {
    listDocumentsUseCase,
    bookingRepository,
    quoteRepository,
    customerRepository,
  } = getContainer();

  const documents = await listDocumentsUseCase.byAgency(agencyId);

  // Résolution en batch des entités liées : booking, quote, et finalement
  // customer. On accepte ici un peu de sur-fetch (quelques dizaines de
  // lignes admin) pour garder le code simple — si ça devient chaud on
  // pourra introduire un `findByIds` côté repo.
  const bookingIds = Array.from(
    new Set(
      documents
        .map((d) => d.bookingId)
        .filter((id): id is string => !!id)
    )
  );
  const quoteIds = Array.from(
    new Set(
      documents
        .map((d) => d.quoteId)
        .filter((id): id is string => !!id)
    )
  );

  const [bookings, quotes] = await Promise.all([
    Promise.all(bookingIds.map((id) => bookingRepository.findById(id))),
    Promise.all(quoteIds.map((id) => quoteRepository.findById(id))),
  ]);

  const bookingById = new Map(
    bookings
      .filter((b): b is NonNullable<typeof b> => !!b)
      .map((b) => [b.id, b])
  );
  const quoteById = new Map(
    quotes
      .filter((q): q is NonNullable<typeof q> => !!q)
      .map((q) => [q.id, q])
  );

  // Customers déduits des bookings ET des quotes.
  const customerIds = new Set<string>();
  for (const b of bookingById.values()) customerIds.add(b.customerId);
  for (const q of quoteById.values()) customerIds.add(q.customerId);
  const customers = await Promise.all(
    Array.from(customerIds).map((id) => customerRepository.findById(id))
  );
  const customerById = new Map(
    customers
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => [c.id, c])
  );

  // Prépare la structure envoyée au composant client — déjà résolue,
  // pas d'aller-retour serveur nécessaire pour afficher les lignes.
  const enriched: EnrichedDocument[] = documents.map((doc) => {
    const booking = doc.bookingId ? bookingById.get(doc.bookingId) : null;
    const quote = doc.quoteId ? quoteById.get(doc.quoteId) : null;
    const customerId = booking?.customerId ?? quote?.customerId ?? null;
    const customer = customerId ? customerById.get(customerId) : null;
    return {
      id: doc.id,
      type: doc.type,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      size: doc.size,
      createdAt: doc.createdAt,
      bookingId: doc.bookingId,
      quoteId: doc.quoteId,
      invoiceNumber: doc.invoiceNumber,
      quoteNumber: doc.quoteNumber,
      customer: customer
        ? {
            id: customer.id,
            firstName: customer.firstName,
            lastName: customer.lastName,
          }
        : null,
      booking: booking
        ? {
            id: booking.id,
            startDate: booking.startDate,
            endDate: booking.endDate,
          }
        : null,
      quoteValidUntil: quote?.validUntil ?? null,
    };
  });

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Documents</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6 overflow-y-auto">
        <PageHeader
          title="Documents"
          description={`${documents.length} document${documents.length > 1 ? "s" : ""}`}
        />
        <DocumentsTabbedView documents={enriched} />
      </div>
    </>
  );
}
