"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { UploadDocumentDialog } from "./upload-document-dialog";
import {
  deleteDocument,
  getDocumentDownloadUrl,
  getDocumentInlineUrl,
} from "@/actions/admin/documents";
import {
  PiPlus,
  PiDownload,
  PiEye,
  PiTrash,
  PiFilePdf,
  PiImage,
} from "react-icons/pi";
import { formatDateCayenne } from "@/lib/format-date";
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
 * Structure enrichie côté serveur pour la vue Documents tabbée : on
 * joint le client (via booking ou quote) et les méta devis (valid_until)
 * pour éviter des fetchs supplémentaires côté client.
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
}

const TYPE_LABELS: Record<DocumentType, string> = {
  invoice: "Facture",
  contract: "Contrat",
  quote: "Devis",
  inspection: "État des lieux",
  other: "Autre",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
}

export function DocumentsContent({
  documents,
  bookingById,
  bookingIdFilter,
  headerExtra,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleView = async (id: string) => {
    setLoading(true);
    const url = await getDocumentInlineUrl(id);
    setLoading(false);
    if (url) window.open(url, "_blank");
  };

  const handleDownload = async (id: string) => {
    setLoading(true);
    const url = await getDocumentDownloadUrl(id);
    setLoading(false);
    // Hitting the URL triggers the download thanks to Content-Disposition:
    // attachment. Using a hidden anchor keeps the current tab focused.
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const doc = documents.find((d) => d.id === deleteId);
    await deleteDocument(deleteId, doc?.bookingId ?? null);
    setDeleteId(null);
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      {loading && <ContentOverlay />}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">
            {bookingIdFilter ? "Documents liés" : "Tous les documents"}
          </CardTitle>
          <div className="flex items-center gap-2">
            {headerExtra}
            <Button
              variant="default"
              size="sm"
              onClick={() => setUploadOpen(true)}
            >
              <PiPlus className="size-4" />
              Importer un document
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">
              Aucun document. Téléversez une facture, un contrat ou tout autre
              fichier.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Réservation</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Ajouté le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const booking = doc.bookingId
                    ? bookingById[doc.bookingId]
                    : null;
                  const isPdf = doc.mimeType === "application/pdf";
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {isPdf ? (
                            <PiFilePdf className="size-5 text-red-500 shrink-0" />
                          ) : (
                            <PiImage className="size-5 text-blue-500 shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate max-w-[280px]">
                            {doc.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {TYPE_LABELS[doc.type]}
                      </TableCell>
                      <TableCell className="text-sm">
                        {booking ? (
                          <Link
                            href={`/admin/reservations/${booking.id}`}
                            className="text-black underline hover:no-underline"
                          >
                            {formatDateCayenne(
                              booking.startDate,
                              "dd MMM yyyy",
                            )}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatSize(doc.size)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateCayenne(doc.createdAt, "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleView(doc.id)}
                            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                            title="Visualiser"
                          >
                            <PiEye className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc.id)}
                            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                            title="Télécharger"
                          >
                            <PiDownload className="size-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(doc.id)}
                            className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                            title="Supprimer"
                          >
                            <PiTrash className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le fichier sera définitivement supprimé du stockage. Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black text-black hover:text-green bg-transparent shadow-none">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={buttonVariants({ variant: "red" })}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
