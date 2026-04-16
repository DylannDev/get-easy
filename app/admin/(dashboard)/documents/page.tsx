import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { DocumentsContent } from "@/components/admin/documents/documents-content";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";

export default async function DocumentsPage() {
  const agencyId = await getActiveAgency();
  const { listDocumentsUseCase, bookingRepository } = getContainer();
  const documents = await listDocumentsUseCase.byAgency(agencyId);

  // Resolve booking summaries in one batch for the rows that carry a booking_id
  const bookingIds = Array.from(
    new Set(documents.map((d) => d.bookingId).filter((id): id is string => !!id))
  );
  const bookings = await Promise.all(
    bookingIds.map((id) => bookingRepository.findById(id))
  );
  const bookingById = new Map(
    bookings
      .filter((b): b is NonNullable<typeof b> => !!b)
      .map((b) => [b.id, b])
  );

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
        <DocumentsContent
          documents={documents}
          bookingById={Object.fromEntries(bookingById)}
        />
      </div>
    </>
  );
}
