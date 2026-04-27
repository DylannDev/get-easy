import {
  addDays,
  differenceInDays,
  startOfDay,
  isAfter,
  isBefore,
  max,
  min,
  startOfDay as _startOfDay,
} from "date-fns";
import type { ViewMode } from "./planning-constants";

interface Args {
  startDate: string;
  endDate: string;
  rangeStart: Date;
  rangeEnd: Date;
  unitWidth: number;
  totalWidth: number;
  viewMode: ViewMode;
}

/** Vérifie qu'une réservation chevauche la période visible du planning. */
export function isBookingVisible(
  startDate: string,
  endDate: string,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const s = new Date(startDate);
  const e = new Date(endDate);
  return isBefore(s, rangeEnd) && isAfter(e, rangeStart);
}

/** Calcule la position et la largeur d'une barre de réservation sur la
 *  timeline. Les dates sont normalisées au jour entier (le dernier jour est
 *  toujours inclus). Une largeur minimale est appliquée pour que les très
 *  courtes locations restent cliquables. */
export function getBarStyle({
  startDate,
  endDate,
  rangeStart,
  rangeEnd,
  unitWidth,
  totalWidth,
  viewMode,
}: Args): { left: number; width: number } {
  const s = startOfDay(new Date(startDate));
  const e = addDays(startOfDay(new Date(endDate)), 1);
  const clampedStart = max([s, rangeStart]);
  const clampedEnd = min([e, rangeEnd]);
  const totalDays = Math.max(differenceInDays(rangeEnd, rangeStart), 1);

  if (viewMode === "day") {
    const daysDiff = differenceInDays(clampedStart, rangeStart);
    const duration = differenceInDays(clampedEnd, clampedStart);
    return {
      left: daysDiff * unitWidth,
      width: Math.max(duration * unitWidth, unitWidth * 0.5),
    };
  }

  if (viewMode === "week") {
    const daysDiff = differenceInDays(clampedStart, rangeStart);
    const duration = differenceInDays(clampedEnd, clampedStart);
    return {
      left: (daysDiff / 7) * unitWidth,
      width: Math.max((duration / 7) * unitWidth, unitWidth * 0.2),
    };
  }

  // month & year
  const daysDiff = differenceInDays(clampedStart, rangeStart);
  const duration = differenceInDays(clampedEnd, clampedStart);
  return {
    left: (daysDiff / totalDays) * totalWidth,
    width: Math.max((duration / totalDays) * totalWidth, 20),
  };
}

/** Position en pixels du marqueur "Aujourd'hui" sur la timeline, ou null
 *  si on est hors période. */
export function getTodayMarkerLeft(
  columns: { date: Date; isToday: boolean }[],
  rangeStart: Date,
  rangeEnd: Date,
  unitWidth: number,
  totalWidth: number,
  viewMode: ViewMode,
): number | null {
  const today = _startOfDay(new Date());
  if (isBefore(today, rangeStart) || isAfter(today, rangeEnd)) return null;

  if (viewMode === "day") {
    const idx = columns.findIndex((c) => c.isToday);
    if (idx < 0) return null;
    return idx * unitWidth + unitWidth / 2;
  }

  const totalDays = Math.max(differenceInDays(rangeEnd, rangeStart), 1);
  const daysDiff = differenceInDays(today, rangeStart);
  return (daysDiff / totalDays) * totalWidth;
}
