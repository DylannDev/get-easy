"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import type { EnrichedDocument } from "./documents-content";
import { useDocumentsFilter } from "./tabbed/use-documents-filter";
import { useDocumentActions } from "./shared/use-document-actions";
import { DocumentsFilters } from "./tabbed/documents-filters";
import { DocumentsTable } from "./tabbed/documents-table";
import { DeleteDocumentDialog } from "./shared/delete-document-dialog";

interface Props {
  documents: EnrichedDocument[];
}

/**
 * Vue à onglets des documents (factures/devis/contrats/EDL) avec recherche
 * et filtre année. Délègue le state à `useDocumentsFilter` et les actions
 * à `useDocumentActions` (visualiser/télécharger/supprimer).
 */
export function DocumentsTabbedView({ documents }: Props) {
  const {
    tab,
    setTab,
    search,
    setSearch,
    yearFilter,
    setYearFilter,
    availableYears,
    rows,
  } = useDocumentsFilter(documents);

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
        <CardHeader className="space-y-4 pb-4">
          <DocumentsFilters
            tab={tab}
            setTab={setTab}
            search={search}
            setSearch={setSearch}
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            availableYears={availableYears}
          />
        </CardHeader>
        <CardContent className="p-0">
          <DocumentsTable
            rows={rows}
            tab={tab}
            onView={handleView}
            onDownload={handleDownload}
            onDelete={setDeleteId}
          />
        </CardContent>
      </Card>

      <DeleteDocumentDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
