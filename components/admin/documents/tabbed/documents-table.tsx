"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EnrichedDocument } from "../documents-content";
import { DocumentRow } from "./document-row";
import type { TabKey } from "./types";

interface Props {
  rows: EnrichedDocument[];
  tab: TabKey;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Tableau des documents pour l'onglet courant — entête colonnes adapté
 *  selon le `tab`, lignes déléguées à `<DocumentRow />`. */
export function DocumentsTable({
  rows,
  tab,
  onView,
  onDownload,
  onDelete,
}: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4 sm:p-6">
        Aucun document ne correspond aux filtres.
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fichier</TableHead>
          <TableHead>Client</TableHead>
          {tab === "quote" && <TableHead>Validité</TableHead>}
          {tab === "contract" && <TableHead>Période</TableHead>}
          {tab === "inspection" && <TableHead>Type</TableHead>}
          {tab === "inspection" && <TableHead>Période</TableHead>}
          <TableHead>Taille</TableHead>
          <TableHead>Émis le</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            tab={tab}
            onView={onView}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
