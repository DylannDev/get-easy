"use client";

import { useEffect, useState } from "react";
import { formatDateCayenne } from "@/lib/format-date";
import { useNavigateWithLoader } from "@/components/admin/shared/loading-link";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/admin/shared/booking-status-badge";
import { Pagination } from "@/components/admin/shared/pagination";
import { ReservationsFilters } from "./reservations-filters";
import {
  getLastSeenTimestamp,
  markBookingsAsSeen,
  isNewBooking,
} from "@/hooks/use-last-seen-bookings";
import type { BookingWithDetails, BookingStatus } from "@/domain/booking";
import { PiPencilSimple, PiTrash } from "react-icons/pi";
import { BookingStatusChangeDialog } from "./booking-status-change-dialog";
import { BookingDeleteDialog } from "./booking-delete-dialog";

interface ReservationsTableProps {
  bookings: BookingWithDetails[];
  currentPage: number;
  totalPages: number;
}

export function ReservationsTable({
  bookings,
  currentPage,
  totalPages,
}: ReservationsTableProps) {
  const { pending: navPending, navigate } = useNavigateWithLoader();

  // Initialisé à undefined pour le premier render (SSR) — pas de
  // surbrillance tant que localStorage n'a pas été lu côté client.
  const [lastSeen, setLastSeen] = useState<string | null | undefined>(
    undefined,
  );
  // Booking sélectionné pour le changement de statut (null = dialog fermée).
  const [statusEdit, setStatusEdit] = useState<{
    bookingId: string;
    currentStatus: BookingStatus;
  } | null>(null);
  // Booking sélectionné pour la suppression (null = dialog fermée).
  const [deleteTarget, setDeleteTarget] = useState<{
    bookingId: string;
    customerName: string;
  } | null>(null);

  useEffect(() => {
    // Lit localStorage côté client uniquement, puis marque comme vu.
    Promise.resolve().then(() => {
      setLastSeen(getLastSeenTimestamp());
      markBookingsAsSeen();
    });
  }, []);

  return (
    <Card>
      {navPending && <ContentOverlay />}
      <CardHeader className="flex flex-col gap-4 space-y-0 pb-4">
        <ReservationsFilters />
      </CardHeader>
      <CardContent className="p-0">
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 sm:p-6">
            Aucune réservation trouvée.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Départ</TableHead>
                  <TableHead>Retour</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Plaque</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const isNew =
                    lastSeen !== undefined &&
                    isNewBooking(booking.createdAt, lastSeen);
                  return (
                  <TableRow
                    key={booking.id}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      isNew
                        ? "bg-green/5 border-l-2 border-l-green"
                        : ""
                    }`}
                    onClick={() => navigate(`/admin/reservations/${booking.id}`)}
                  >
                    <TableCell>
                      <div>
                        <span className="font-medium capitalize">
                          {booking.customerFirstName}{" "}
                          {booking.customerLastName}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {booking.customerEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateCayenne(booking.startDate, "dd MMM yyyy HH'h'mm")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateCayenne(booking.endDate, "dd MMM yyyy HH'h'mm")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Math.round(booking.totalPrice)} €
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {booking.vehicleBrand} {booking.vehicleModel}
                      {booking.vehicleColor ? ` ${booking.vehicleColor}` : ""}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {booking.vehicleRegistrationPlate}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusEdit({
                              bookingId: booking.id,
                              currentStatus: booking.status,
                            });
                          }}
                          title="Changer le statut"
                          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                        >
                          <PiPencilSimple className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({
                              bookingId: booking.id,
                              customerName: `${booking.customerFirstName} ${booking.customerLastName}`,
                            });
                          }}
                          title="Supprimer la réservation"
                          className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
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
            <div className="border-t px-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          </>
        )}
      </CardContent>

      {statusEdit && (
        <BookingStatusChangeDialog
          open={!!statusEdit}
          onOpenChange={(next) => {
            if (!next) setStatusEdit(null);
          }}
          bookingId={statusEdit.bookingId}
          currentStatus={statusEdit.currentStatus}
        />
      )}

      {deleteTarget && (
        <BookingDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(next) => {
            if (!next) setDeleteTarget(null);
          }}
          bookingId={deleteTarget.bookingId}
          customerName={deleteTarget.customerName}
        />
      )}
    </Card>
  );
}
