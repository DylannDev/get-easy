"use client";

import { LoadingLink } from "@/components/admin/shared/loading-link";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  PiDownload,
  PiEye,
  PiFilePdf,
  PiImage,
  PiTrash,
} from "react-icons/pi";
import { formatDateCayenne } from "@/lib/format-date";
import type { Document, DocumentType } from "@/domain/document";
import type { Booking } from "@/domain/booking";

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

interface Props {
  doc: Document;
  booking: Booking | null;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Ligne du tableau "Tous les documents" (vue liste simple, sans onglets). */
export function DocumentRow({
  doc,
  booking,
  onView,
  onDownload,
  onDelete,
}: Props) {
  const isPdf = doc.mimeType === "application/pdf";
  return (
    <TableRow>
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
      <TableCell className="text-sm">{TYPE_LABELS[doc.type]}</TableCell>
      <TableCell className="text-sm">
        {booking ? (
          <LoadingLink
            href={`/admin/reservations/${booking.id}`}
            className="text-black underline hover:no-underline"
          >
            {formatDateCayenne(booking.startDate, "dd MMM yyyy")}
          </LoadingLink>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-sm">{formatSize(doc.size)}</TableCell>
      <TableCell className="text-sm">
        {formatDateCayenne(doc.createdAt, "dd MMM yyyy")}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onView(doc.id)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
            title="Visualiser"
          >
            <PiEye className="size-4" />
          </button>
          <button
            onClick={() => onDownload(doc.id)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
            title="Télécharger"
          >
            <PiDownload className="size-4" />
          </button>
          <button
            onClick={() => onDelete(doc.id)}
            className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
            title="Supprimer"
          >
            <PiTrash className="size-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
