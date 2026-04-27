"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Document } from "@/domain/document";
import type { Booking } from "@/domain/booking";
import { DocumentRow } from "./document-row";

interface Props {
  documents: Document[];
  bookingById: Record<string, Booking>;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Tableau "Tous les documents" — colonne Réservation = lien vers la fiche
 *  réservation associée si rattachée, "—" sinon. */
export function DocumentsTable({
  documents,
  bookingById,
  onView,
  onDownload,
  onDelete,
}: Props) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4 sm:p-6">
        Aucun document. Téléversez une facture, un contrat ou tout autre
        fichier.
      </p>
    );
  }
  return (
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
        {documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            booking={doc.bookingId ? (bookingById[doc.bookingId] ?? null) : null}
            onView={onView}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
