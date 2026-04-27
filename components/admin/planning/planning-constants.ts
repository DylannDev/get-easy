export type ViewMode = "day" | "week" | "month" | "year";

export const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
];

export const UNIT_WIDTH: Record<ViewMode, number> = {
  day: 80,
  week: 160,
  month: 180,
  year: 250,
};

export const ROW_HEIGHT = 70;
export const HEADER_HEIGHT = 50;
export const MONTH_HEADER_HEIGHT = 30;
export const VEHICLE_COL_WIDTH = 200;

/** Couleur d'affichage d'un booking sur la timeline, en fonction du statut
 *  et de la position de "maintenant" par rapport à la période de location. */
export function getBookingDisplayStatus(
  booking: { status: string; startDate: string; endDate: string },
  now: number,
): { label: string; colors: { bg: string; text: string } } {
  const start = new Date(booking.startDate).getTime();
  const end = new Date(booking.endDate).getTime();

  if (booking.status === "pending_payment") {
    return { label: "En attente", colors: { bg: "#fbbf24", text: "#020202" } };
  }
  if (booking.status === "paid") {
    if (now < start)
      return { label: "À venir", colors: { bg: "#93c5fd", text: "#020202" } };
    if (now >= start && now <= end)
      return { label: "En cours", colors: { bg: "#ccff33", text: "#020202" } };
    return { label: "Finalisée", colors: { bg: "#a1a1aa", text: "#ffffff" } };
  }
  return { label: booking.status, colors: { bg: "#94a3b8", text: "#020202" } };
}
