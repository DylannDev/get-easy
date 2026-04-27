"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CustomerDocumentsUpload,
  stagedDocsToPayload,
  type StagedDocState,
} from "@/components/booking/customer-documents-upload";
import { importCustomerDocuments } from "@/actions/admin/import-customer-documents";
import { removeStagedCustomerDocument } from "@/actions/customer-documents";
import { toast } from "react-hot-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & (
  | { bookingId: string; customerId?: never }
  | { customerId: string; bookingId?: never }
);

export function ImportCustomerDocumentsDialog({
  open,
  onOpenChange,
  bookingId,
  customerId,
}: Props) {
  const router = useRouter();
  const [stagedDocs, setStagedDocs] = useState<StagedDocState>({});
  const [importing, setImporting] = useState(false);

  // Réinitialise à chaque ouverture (setState wrappé pour React 19 Compiler).
  useEffect(() => {
    if (!open) return;
    Promise.resolve().then(() => {
      setStagedDocs({});
    });
  }, [open]);

  const totalFiles = Object.values(stagedDocs).reduce(
    (sum, files) => sum + (files?.length ?? 0),
    0
  );

  const cleanupStaging = async () => {
    // Si l'admin annule, on nettoie les fichiers en staging Supabase pour
    // ne pas laisser d'orphelins. Erreurs silencieuses.
    const allKeys = Object.values(stagedDocs)
      .flat()
      .filter((f): f is NonNullable<typeof f> => !!f)
      .map((f) => f.stagingKey);
    await Promise.all(
      allKeys.map((key) =>
        removeStagedCustomerDocument(key).catch(() => {})
      )
    );
  };

  const handleClose = async () => {
    if (totalFiles > 0 && !importing) {
      await cleanupStaging();
    }
    onOpenChange(false);
  };

  const handleImport = async () => {
    if (totalFiles === 0) {
      toast.error("Ajoutez au moins un fichier.");
      return;
    }
    setImporting(true);
    try {
      const stagedDocuments = stagedDocsToPayload(stagedDocs);

      const result = await importCustomerDocuments({
        bookingId,
        customerId,
        stagedDocuments,
      });
      if (result.ok) {
        toast.success(
          `${result.imported} fichier${(result.imported ?? 0) > 1 ? "s" : ""} importé${(result.imported ?? 0) > 1 ? "s" : ""}.`
        );
        setStagedDocs({});
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Échec de l'import.");
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Une erreur inattendue est survenue."
      );
    }
    setImporting(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          void handleClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des pièces justificatives</DialogTitle>
        </DialogHeader>

        <CustomerDocumentsUpload
          value={stagedDocs}
          onChange={setStagedDocs}
          hideHelp
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleClose()}
            disabled={importing}
          >
            Annuler
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleImport}
            disabled={importing || totalFiles === 0}
          >
            {importing
              ? "Import…"
              : totalFiles > 0
                ? `Importer (${totalFiles})`
                : "Importer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
