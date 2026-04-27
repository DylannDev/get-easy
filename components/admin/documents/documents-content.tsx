"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { PiPlus } from "react-icons/pi";
import { UploadDocumentDialog } from "./upload-document-dialog";
import { useDocumentActions } from "./shared/use-document-actions";
import { DeleteDocumentDialog } from "./shared/delete-document-dialog";
import { DocumentsTable } from "./content/documents-table";
import type { Document, DocumentType } from "@/domain/document";
import type { Booking } from "@/domain/booking";

interface Props {
  documents: Document[];
  bookingById: Record<string, Booking>;
  bookingIdFilter?: string;
  /** Optional slot rendered to the left of the "Importer" button. */
  headerExtra?: React.ReactNode;
}

/**
 * Structure enrichie côté serveur pour la vue Documents tabbée : on joint
 * le client (via booking ou quote) et les méta devis (valid_until) pour
 * éviter des fetchs supplémentaires côté client.
 */
export interface EnrichedDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  bookingId: string | null;
  quoteId: string | null;
  invoiceNumber: string | null;
  quoteNumber: string | null;
  customer: { id: string; firstName: string; lastName: string } | null;
  booking: { id: string; startDate: string; endDate: string } | null;
  quoteValidUntil: string | null;
  /** Pour les docs `inspection` : type "departure" / "return" (sinon null). */
  inspectionType: "departure" | "return" | null;
}

/**
 * Vue liste simple des documents (rattachés à une réservation ou non).
 * Utilisée à la fois pour la liste globale "Tous les documents" et pour
 * la liste filtrée d'une réservation. Les actions et le dialog de
 * confirmation sont mutualisés avec la vue à onglets via `./shared/`.
 */
export function DocumentsContent({
  documents,
  bookingById,
  bookingIdFilter,
  headerExtra,
}: Props) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const {
    loading,
    deleteId,
    setDeleteId,
    handleView,
    handleDownload,
    handleDelete,
  } = useDocumentActions(documents);

  return (
    <>
      {loading && <ContentOverlay />}

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 pb-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">
            {bookingIdFilter ? "Documents liés" : "Tous les documents"}
          </CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:flex-wrap md:justify-end">
            {headerExtra}
            <Button
              variant="default"
              size="sm"
              className="w-full md:w-auto"
              onClick={() => setUploadOpen(true)}
            >
              <PiPlus className="size-4" />
              Importer un document
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DocumentsTable
            documents={documents}
            bookingById={bookingById}
            onView={handleView}
            onDownload={handleDownload}
            onDelete={setDeleteId}
          />
        </CardContent>
      </Card>

      <UploadDocumentDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          setUploadOpen(false);
          router.refresh();
        }}
        bookingId={bookingIdFilter}
      />

      <DeleteDocumentDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
