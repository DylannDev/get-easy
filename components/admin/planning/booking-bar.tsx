"use client";

import { useNavigateWithLoader } from "@/components/admin/shared/loading-link";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import type { BookingWithDetails } from "@/domain/booking";
import {
  ROW_HEIGHT,
  getBookingDisplayStatus,
} from "./planning-constants";

interface Props {
  booking: BookingWithDetails;
  now: number;
  left: number;
  width: number;
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
}

/** Barre représentant une réservation sur la timeline du planning.
 *  Cliquable → ouvre la fiche /admin/reservations/{id}. Une bande d'avancée
 *  (% de durée écoulée) est affichée en bas pour les réservations en cours. */
export function BookingBar({
  booking,
  now,
  left,
  width,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const { pending, navigate } = useNavigateWithLoader();
  const { label, colors } = getBookingDisplayStatus(booking, now);
  const startMs = new Date(booking.startDate).getTime();
  const endMs = new Date(booking.endDate).getTime();
  const pct =
    now <= startMs
      ? 0
      : now >= endMs
        ? 100
        : Math.round(((now - startMs) / (endMs - startMs)) * 100);

  return (
    <>
      {pending && <ContentOverlay />}
      <div
      className="absolute top-2 rounded-md cursor-pointer hover:brightness-95 transition-all z-5 shadow-sm"
      style={{
        left,
        width,
        height: ROW_HEIGHT - 16,
        backgroundColor: colors.bg,
      }}
      onClick={() => navigate(`/admin/reservations/${booking.id}`)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="px-2 py-1 h-full flex flex-col justify-center overflow-hidden rounded-md">
        <div
          className="text-sm font-semibold truncate"
          style={{ color: colors.text }}
        >
          {booking.customerFirstName} {booking.customerLastName}
        </div>
        <div
          className="text-xs truncate opacity-70"
          style={{ color: colors.text }}
        >
          {label}
        </div>
      </div>
      {pct > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-md overflow-hidden">
          <div
            className="h-full bg-black/20 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
    </>
  );
}
