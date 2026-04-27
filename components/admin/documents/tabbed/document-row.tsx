"use client";

import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  PiDownload,
  PiEye,
  PiFilePdf,
  PiImage,
  PiTrash,
} from "react-icons/pi";
import { formatDateCayenne } from "@/lib/format-date";
import { isQuoteExpired } from "@/domain/quote";
import type { EnrichedDocument } from "../documents-content";
import { INSPECTION_TYPE_LABELS, formatSize, type TabKey } from "./types";

interface Props {
  doc: EnrichedDocument;
  tab: TabKey;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Ligne du tableau de documents. Les colonnes spécifiques (validité devis,
 *  période contrat/EDL, type EDL) ne s'affichent que dans l'onglet
 *  correspondant. Le caller garantit que l'en-tête de table matche `tab`. */
export function DocumentRow({ doc, tab, onView, onDownload, onDelete }: Props) {
  const isPdf = doc.mimeType === "application/pdf";
  const expired =
    tab === "quote" && doc.quoteValidUntil
      ? isQuoteExpired({ validUntil: doc.quoteValidUntil })
      : false;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          {isPdf ? (
            <PiFilePdf className="size-5 text-red-500 shrink-0" />
          ) : (
            <PiImage className="size-5 text-blue-500 shrink-0" />
          )}
          <span className="text-sm font-medium truncate max-w-[260px]">
            {doc.fileName}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm">
        {doc.customer ? (
          <Link
            href={`/admin/clients/${doc.customer.id}`}
            className="text-black underline hover:no-underline"
          >
            {doc.customer.firstName} {doc.customer.lastName}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      {tab === "quote" && (
        <TableCell className="text-sm">
          {doc.quoteValidUntil ? (
            <div className="flex items-center gap-2">
              <span className={expired ? "text-muted-foreground" : ""}>
                {formatDateCayenne(doc.quoteValidUntil, "dd MMM yyyy")}
              </span>
              {expired && (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-red-50 text-red-600 border border-red-100">
                  Expiré
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
      )}
      {tab === "contract" && <BookingPeriodCell booking={doc.booking} />}
      {tab === "inspection" && (
        <TableCell className="text-sm">
          {doc.inspectionType ? (
            INSPECTION_TYPE_LABELS[doc.inspectionType]
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
      )}
      {tab === "inspection" && <BookingPeriodCell booking={doc.booking} />}
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

function BookingPeriodCell({
  booking,
}: {
  booking: EnrichedDocument["booking"];
}) {
  if (!booking) {
    return (
      <TableCell className="text-sm">
        <span className="text-muted-foreground">—</span>
      </TableCell>
    );
  }
  return (
    <TableCell className="text-sm">
      <span>
        {formatDateCayenne(booking.startDate, "dd MMM")}
        {" → "}
        {formatDateCayenne(booking.endDate, "dd MMM yyyy")}
      </span>
    </TableCell>
  );
}
