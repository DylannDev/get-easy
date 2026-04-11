"use client";

import { formatDateCayenne } from "@/lib/format-date";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/admin/shared/booking-status-badge";
import { Pagination } from "@/components/admin/shared/pagination";
import { ReservationsFilters } from "./reservations-filters";
import type { BookingWithDetails } from "@/domain/booking";

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
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 pb-4">
        <ReservationsFilters />
      </CardHeader>
      <CardContent className="p-0">
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/admin/reservations/${booking.id}`)
                    }
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
                      {booking.vehicleColor
                        ? ` ${booking.vehicleColor}`
                        : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
