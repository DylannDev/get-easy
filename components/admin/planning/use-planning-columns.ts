"use client";

import { useMemo } from "react";
import {
  addDays,
  addYears,
  startOfMonth,
  startOfWeek,
  startOfYear,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isToday,
  isBefore,
  isAfter,
} from "date-fns";
import { formatDateCayenne } from "@/lib/format-date";
import type { PlanningVehicleRow } from "@/application/admin/get-planning-data.use-case";
import type { ViewMode } from "./planning-constants";

export interface PlanningColumn {
  date: Date;
  label: string;
  sublabel: string;
  isToday: boolean;
}

interface Result {
  columns: PlanningColumn[];
  rangeStart: Date;
  rangeEnd: Date;
  periodLabel: string;
  monthHeaders: { label: string; span: number }[];
}

/**
 * Calcule les colonnes à afficher dans le Gantt selon le mode (jour/semaine/
 * mois/année) et la date d'ancrage. Pour les vues jour/semaine, étend la
 * période courante pour englober les réservations qui chevauchent le mois
 * sélectionné. Renvoie aussi le `periodLabel` du toolbar et les en-têtes de
 * mois (regroupement des colonnes par mois) pour les vues jour/semaine.
 */
export function usePlanningColumns(
  rows: PlanningVehicleRow[],
  anchorDate: Date,
  viewMode: ViewMode,
): Result {
  const dataRange = useMemo(() => {
    const now = new Date();
    let earliest = startOfMonth(now);
    let latest = endOfMonth(now);

    for (const row of rows) {
      for (const b of row.bookings) {
        const s = new Date(b.startDate);
        const e = new Date(b.endDate);
        if (isBefore(s, earliest)) earliest = s;
        if (isAfter(e, latest)) latest = e;
      }
    }

    return { start: startOfMonth(earliest), end: endOfMonth(latest) };
  }, [rows]);

  const { columns, rangeStart, rangeEnd } = useMemo(() => {
    if (viewMode === "day") {
      const monthStart = startOfMonth(anchorDate);
      const monthEnd = endOfMonth(anchorDate);

      let earliest = monthStart;
      let latest = monthEnd;
      for (const row of rows) {
        for (const b of row.bookings) {
          const s = new Date(b.startDate);
          const e = new Date(b.endDate);
          if (isBefore(s, monthEnd) && isAfter(e, monthStart)) {
            if (isBefore(s, earliest)) earliest = startOfMonth(s);
            if (isAfter(e, latest)) latest = endOfMonth(e);
          }
        }
      }

      const days = eachDayOfInterval({ start: earliest, end: latest });
      return {
        columns: days.map((d) => ({
          date: d,
          label: formatDateCayenne(d.toISOString(), "EEE"),
          sublabel: formatDateCayenne(d.toISOString(), "d"),
          isToday: isToday(d),
        })),
        rangeStart: earliest,
        rangeEnd: addDays(latest, 1),
      };
    }

    if (viewMode === "week") {
      const monthStart = startOfMonth(anchorDate);
      const monthEnd = endOfMonth(anchorDate);

      let earliest = monthStart;
      let latest = monthEnd;
      for (const row of rows) {
        for (const b of row.bookings) {
          const s = new Date(b.startDate);
          const e = new Date(b.endDate);
          if (isBefore(s, monthEnd) && isAfter(e, monthStart)) {
            if (isBefore(s, earliest)) earliest = startOfMonth(s);
            if (isAfter(e, latest)) latest = endOfMonth(e);
          }
        }
      }

      const start = startOfWeek(earliest, { weekStartsOn: 1 });
      const weeks = eachWeekOfInterval(
        { start, end: latest },
        { weekStartsOn: 1 },
      );
      return {
        columns: weeks.map((d) => ({
          date: d,
          label: formatDateCayenne(d.toISOString(), "'S'w"),
          sublabel: "",
          isToday: false,
        })),
        rangeStart: start,
        rangeEnd: addDays(latest, 1),
      };
    }

    if (viewMode === "year") {
      const start = startOfYear(dataRange.start);
      const end = addYears(endOfMonth(dataRange.end), 1);
      const years = new Map<number, Date>();
      for (const m of eachMonthOfInterval({ start, end })) {
        const y = m.getFullYear();
        if (!years.has(y)) years.set(y, m);
      }
      return {
        columns: Array.from(years.entries()).map(([y, d]) => ({
          date: d,
          label: y.toString(),
          sublabel: "",
          isToday: false,
        })),
        rangeStart: start,
        rangeEnd: end,
      };
    }

    // month
    const months = eachMonthOfInterval({
      start: dataRange.start,
      end: dataRange.end,
    });
    return {
      columns: months.map((d) => ({
        date: d,
        label: formatDateCayenne(d.toISOString(), "MMM"),
        sublabel: formatDateCayenne(d.toISOString(), "yyyy"),
        isToday: false,
      })),
      rangeStart: dataRange.start,
      rangeEnd: addDays(dataRange.end, 1),
    };
  }, [viewMode, anchorDate, dataRange, rows]);

  const periodLabel = useMemo(() => {
    if (columns.length === 0) return "";
    if (viewMode === "day" || viewMode === "week") {
      return formatDateCayenne(anchorDate.toISOString(), "MMMM yyyy");
    }
    if (viewMode === "year") {
      const first = columns[0].date;
      const last = columns[columns.length - 1].date;
      return `${first.getFullYear()} — ${last.getFullYear()}`;
    }
    const first = columns[0].date;
    const last = columns[columns.length - 1].date;
    return `${formatDateCayenne(first.toISOString(), "MMM yyyy")} — ${formatDateCayenne(last.toISOString(), "MMM yyyy")}`;
  }, [columns, viewMode, anchorDate]);

  const monthHeaders = useMemo(() => {
    if (viewMode !== "day" && viewMode !== "week") return [];
    const headers: { label: string; span: number }[] = [];
    let lastKey = "";
    for (const col of columns) {
      const key = formatDateCayenne(col.date.toISOString(), "MMMM yyyy");
      if (key === lastKey && headers.length > 0) {
        headers[headers.length - 1].span++;
      } else {
        headers.push({ label: key, span: 1 });
        lastKey = key;
      }
    }
    return headers;
  }, [columns, viewMode]);

  return { columns, rangeStart, rangeEnd, periodLabel, monthHeaders };
}
