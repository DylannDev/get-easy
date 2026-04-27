"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  PiEye,
  PiDownload,
  PiTrash,
  PiFilePdf,
  PiImage,
  PiPlus,
} from "react-icons/pi";
import { ImportCustomerDocumentsDialog } from "./import-customer-documents-dialog";
import { formatDateCayenne } from "@/lib/format-date";
import {
  type CustomerDocument,
  CUSTOMER_DOCUMENT_TYPE_LABELS,
} from "@/domain/customer-document";
import {
  deleteCustomerDocument,
  getCustomerDocumentDownloadUrl,
  getCustomerDocumentInlineUrl,
} from "@/actions/admin/customer-documents";

interface Props {
  documents: CustomerDocument[];
  /**
   * Contexte : fiche client ou fiche booking. Influence le `revalidatePath`
   * après suppression.
   */
  context: { customerId?: string; bookingId?: string };
  title?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export function CustomerDocumentsSection({
  documents,
  context,
  title = "Pièces justificatives du client",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const handleView = async (id: string) => {
    setLoading(true);
    const url = await getCustomerDocumentInlineUrl(id);
    setLoading(false);
    if (url) window.open(url, "_blank");
  };

  const handleDownload = async (id: string) => {
    setLoading(true);
    const url = await getCustomerDocumentDownloadUrl(id);
    setLoading(false);
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
    await deleteCustomerDocument(deleteId, context);
    setDeleteId(null);
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      {loading && <ContentOverlay />}

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {(context.bookingId || context.customerId) && (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setImportOpen(true)}
            >
              <PiPlus className="size-4" />
              Importer des pièces
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 sm:px-6 pb-4 sm:pb-6">
              Aucune pièce jointe pour ce client.
            </p>
          ) : (
            <ul className="divide-y">
              {documents.map((doc) => {
                const isPdf = doc.mimeType === "application/pdf";
                return (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3"
                  >
                    <div className="flex flex-1 items-center gap-3 min-w-0">
                      {isPdf ? (
                        <PiFilePdf className="size-5 text-red-500 shrink-0" />
                      ) : (
                        <PiImage className="size-5 text-blue-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {CUSTOMER_DOCUMENT_TYPE_LABELS[doc.type]}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {doc.fileName} · {formatSize(doc.size)} ·{" "}
                          {formatDateCayenne(doc.createdAt, "dd MMM yyyy")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleView(doc.id)}
                        title="Visualiser"
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                      >
                        <PiEye className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc.id)}
                        title="Télécharger"
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                      >
                        <PiDownload className="size-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(doc.id)}
                        title="Supprimer"
                        className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                      >
                        <PiTrash className="size-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le fichier sera définitivement supprimé du stockage sécurisé.
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

      {context.bookingId ? (
        <ImportCustomerDocumentsDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          bookingId={context.bookingId}
        />
      ) : context.customerId ? (
        <ImportCustomerDocumentsDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          customerId={context.customerId}
        />
      ) : null}
    </>
  );
}
