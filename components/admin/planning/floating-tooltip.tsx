"use client";

import { createPortal } from "react-dom";
import { formatDateCayenne } from "@/lib/format-date";
import type { BookingWithDetails } from "@/domain/booking";
import { getBookingDisplayStatus } from "./planning-constants";

interface Props {
  booking: BookingWithDetails;
  anchorRect: DOMRect;
  containerRect: DOMRect;
  now: number;
}

const TOOLTIP_W = 256;
const TOOLTIP_H = 180;

/** Tooltip flottant via React portal qui suit la position d'une barre du
 *  Gantt et reste contraint à l'intérieur du container du planning. */
export function FloatingTooltip({
  booking,
  anchorRect,
  containerRect,
  now,
}: Props) {
  const { label, colors } = getBookingDisplayStatus(booking, now);

  // Position au-dessus de la barre par défaut.
  let top = anchorRect.top - TOOLTIP_H - 4;
  let left = anchorRect.left;

  // Si le tooltip dépasse en haut, on bascule en dessous.
  if (top < containerRect.top) {
    top = anchorRect.bottom + 4;
  }

  // Reste dans les bornes horizontales du container.
  if (left + TOOLTIP_W > containerRect.right) {
    left = containerRect.right - TOOLTIP_W - 8;
  }
  if (left < containerRect.left) {
    left = containerRect.left + 8;
  }

  return createPortal(
    <div className="fixed z-9999 pointer-events-none" style={{ top, left }}>
      <div
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs"
        style={{ width: TOOLTIP_W }}
      >
        <div className="font-semibold text-sm mb-2 capitalize">
          {booking.customerFirstName} {booking.customerLastName}
        </div>
        <div className="space-y-1.5 text-gray-600">
          <div className="flex justify-between">
            <span>Statut</span>
            <span
              className="font-medium px-1.5 py-0.5 rounded text-xs"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {label}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Départ</span>
            <span className="font-medium text-black">
              {formatDateCayenne(booking.startDate, "dd MMM yyyy HH'h'mm")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Retour</span>
            <span className="font-medium text-black">
              {formatDateCayenne(booking.endDate, "dd MMM yyyy HH'h'mm")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total</span>
            <span className="font-medium text-black">
              {Math.round(booking.totalPrice)} €
            </span>
          </div>
          <div className="flex justify-between">
            <span>Véhicule</span>
            <span className="font-medium text-black">
              {booking.vehicleBrand} {booking.vehicleModel}
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
