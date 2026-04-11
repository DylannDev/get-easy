"use client";

import { useState, useMemo, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  addDays,
  addYears,
  addMonths,
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInDays,
  isToday,
  isBefore,
  isAfter,
  max,
  min,
} from "date-fns";
import { formatDateCayenne } from "@/lib/format-date";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";
import type { PlanningVehicleRow } from "@/application/admin/get-planning-data.use-case";
import type { BookingWithDetails } from "@/domain/booking";

interface PlanningViewProps {
  rows: PlanningVehicleRow[];
}

type ViewMode = "day" | "week" | "month" | "year";

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
];

function getBookingDisplayStatus(
  booking: { status: string; startDate: string; endDate: string },
  now: number
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

const UNIT_WIDTH: Record<ViewMode, number> = {
  day: 80,
  week: 160,
  month: 180,
  year: 250,
};

const ROW_HEIGHT = 70;
const HEADER_HEIGHT = 50;
const VEHICLE_COL_WIDTH = 200;

// ── Wrapper ────────────────────────────────────────────────────
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function PlanningView({ rows }: PlanningViewProps) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!mounted) return <div style={{ height: 400 }} />;
  return <PlanningViewInner rows={rows} />;
}

// ── Floating tooltip (portal) ──────────────────────────────────
function FloatingTooltip({
  booking,
  anchorRect,
  now,
  containerRect,
}: {
  booking: BookingWithDetails;
  anchorRect: DOMRect;
  now: number;
  containerRect: DOMRect;
}) {
  const { label, colors } = getBookingDisplayStatus(booking, now);

  const TOOLTIP_W = 256;
  const TOOLTIP_H = 180;

  // Position above the bar by default
  let top = anchorRect.top - TOOLTIP_H - 4;
  let left = anchorRect.left;

  // If tooltip goes above the container, show below
  if (top < containerRect.top) {
    top = anchorRect.bottom + 4;
  }

  // Keep within container horizontal bounds
  if (left + TOOLTIP_W > containerRect.right) {
    left = containerRect.right - TOOLTIP_W - 8;
  }
  if (left < containerRect.left) {
    left = containerRect.left + 8;
  }

  return createPortal(
    <div
      className="fixed z-9999 pointer-events-none"
      style={{ top, left }}
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs" style={{ width: TOOLTIP_W }}>
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
    document.body
  );
}

// ── Today marker position helper ───────────────────────────────
function getTodayPosition(
  columns: { date: Date; isToday: boolean }[],
  rangeStart: Date,
  rangeEnd: Date,
  unitWidth: number,
  totalWidth: number,
  viewMode: ViewMode
): number | null {
  const today = startOfDay(new Date());

  if (isBefore(today, rangeStart) || isAfter(today, rangeEnd)) return null;

  if (viewMode === "day") {
    const idx = columns.findIndex((c) => isToday(c.date));
    if (idx < 0) return null;
    return idx * unitWidth + unitWidth / 2;
  }

  // For week/month/year: proportional position
  const totalDays = Math.max(differenceInDays(rangeEnd, rangeStart), 1);
  const daysDiff = differenceInDays(today, rangeStart);
  return (daysDiff / totalDays) * totalWidth;
}

// ── Inner component ────────────────────────────────────────────
function PlanningViewInner({ rows }: PlanningViewProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [anchorDate, setAnchorDate] = useState(() => startOfMonth(new Date()));
  const [hoveredBooking, setHoveredBooking] = useState<{
    booking: BookingWithDetails;
    rect: DOMRect;
    containerRect: DOMRect;
  } | null>(null);

  // Data-driven date range
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

  // For day/week: expand range to include bookings that overlap the selected month
  const { columns, rangeStart, rangeEnd } = useMemo(() => {
    const anchor = anchorDate;

    if (viewMode === "day") {
      const monthStart = startOfMonth(anchor);
      const monthEnd = endOfMonth(anchor);

      // Find bookings overlapping this month and expand range
      let earliest = monthStart;
      let latest = monthEnd;
      for (const row of rows) {
        for (const b of row.bookings) {
          const s = new Date(b.startDate);
          const e = new Date(b.endDate);
          // Only expand if booking overlaps selected month
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
        rangeEnd: addDays(latest, 1), // include last day
      };
    }

    if (viewMode === "week") {
      const monthStart = startOfMonth(anchor);
      const monthEnd = endOfMonth(anchor);

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
        { weekStartsOn: 1 }
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

  const unitWidth = UNIT_WIDTH[viewMode];
  const totalWidth = columns.length * unitWidth;

  const isVisible = (startDate: string, endDate: string) => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    return isBefore(s, rangeEnd) && isAfter(e, rangeStart);
  };

  const getBarStyle = (startDate: string, endDate: string) => {
    // Normalize to calendar days to ensure last day is always included
    const s = startOfDay(new Date(startDate));
    const e = addDays(startOfDay(new Date(endDate)), 1); // include last day
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
  };

  const navigate = (dir: number) => {
    if (viewMode === "day" || viewMode === "week") {
      setAnchorDate((d) => addMonths(d, dir));
    }
  };

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

  // Month header row for day/week views
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

  const MONTH_HEADER_HEIGHT = 30;
  const hasMonthHeader = monthHeaders.length > 0;
  const fullHeaderHeight = hasMonthHeader
    ? HEADER_HEIGHT + MONTH_HEADER_HEIGHT
    : HEADER_HEIGHT;

  useEffect(() => {
    if (!scrollRef.current || viewMode !== "day") return;
    const todayIdx = columns.findIndex((c) => c.isToday);
    if (todayIdx > 0) {
      scrollRef.current.scrollLeft = todayIdx * unitWidth - 100;
    }
  }, [columns, unitWidth, viewMode]);

  const [now] = useState(() => Date.now());

  const todayMarkerLeft = useMemo(
    () =>
      getTodayPosition(
        columns,
        rangeStart,
        rangeEnd,
        unitWidth,
        totalWidth,
        viewMode
      ),
    [columns, rangeStart, rangeEnd, unitWidth, totalWidth, viewMode]
  );

  const bookingMap = useMemo(() => {
    const map = new Map<string, BookingWithDetails>();
    for (const row of rows) {
      for (const b of row.bookings) {
        map.set(b.id, b);
      }
    }
    return map;
  }, [rows]);

  const showNav = viewMode === "day" || viewMode === "week";

  const handleBarMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    bookingId: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cRect = containerRef.current?.getBoundingClientRect();
    const booking = bookingMap.get(bookingId);
    if (booking && cRect) setHoveredBooking({ booking, rect, containerRect: cRect });
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Tooltip portal */}
      {hoveredBooking && (
        <FloatingTooltip
          booking={hoveredBooking.booking}
          anchorRect={hoveredBooking.rect}
          now={now}
          containerRect={hoveredBooking.containerRect}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {showNav && (
            <button
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-md border border-gray-300 bg-white flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <PiCaretLeft className="size-4" />
            </button>
          )}
          <span className="text-sm font-medium min-w-[220px] text-center capitalize">
            {periodLabel}
          </span>
          {showNav && (
            <button
              onClick={() => navigate(1)}
              className="h-9 w-9 rounded-md border border-gray-300 bg-white flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <PiCaretRight className="size-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-md border border-gray-300 p-1">
            {VIEW_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setViewMode(m.value)}
                className={`px-3 py-1.5 text-sm rounded-sm cursor-pointer transition-colors ${
                  viewMode === m.value
                    ? "bg-black text-green font-medium"
                    : "text-muted-foreground hover:bg-gray-50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-[#ccff33]" />
              <span className="text-muted-foreground">En cours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-[#93c5fd]" />
              <span className="text-muted-foreground">À venir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-[#a1a1aa]" />
              <span className="text-muted-foreground">Finalisée</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-[#fbbf24]" />
              <span className="text-muted-foreground">En attente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt chart */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="flex">
          {/* Vehicle column (fixed) */}
          <div
            className="shrink-0 border-r border-gray-200 z-10"
            style={{ width: VEHICLE_COL_WIDTH }}
          >
            <div
              className="border-b border-gray-200 px-3 flex items-end pb-2 text-sm font-semibold text-gray-700"
              style={{ height: fullHeaderHeight }}
            >
              Véhicules
            </div>
            {rows.map((row) => (
              <div
                key={row.vehicle.id}
                className="border-b border-gray-100 px-3 flex items-center gap-2.5"
                style={{ height: ROW_HEIGHT }}
              >
                <div
                  className="shrink-0 rounded overflow-hidden"
                  style={{ width: 50, height: 35 }}
                >
                  <Image
                    src={row.vehicle.img}
                    alt={`${row.vehicle.brand} ${row.vehicle.model}`}
                    width={50}
                    height={35}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {row.vehicle.brand} {row.vehicle.model}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {row.vehicle.color} · {row.vehicle.registrationPlate}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline (scrollable) */}
          <div ref={scrollRef} className="overflow-x-auto flex-1">
            <div
              className="relative"
              style={{ width: totalWidth, minWidth: "100%" }}
            >
              {/* Today marker (all views) */}
              {todayMarkerLeft !== null && (
                <>
                  <div
                    className="absolute z-20 -translate-x-1/2 bg-red-400 text-white text-xs font-medium px-1.5 py-0.5 rounded-b"
                    style={{ left: todayMarkerLeft, top: fullHeaderHeight }}
                  >
                    Aujourd&apos;hui
                  </div>
                  <div
                    className="absolute bottom-0 w-0.5 bg-red-400 z-10 pointer-events-none"
                    style={{ left: todayMarkerLeft, top: fullHeaderHeight }}
                  />
                </>
              )}

              {/* Month header (day/week views) */}
              {hasMonthHeader && (
                <div
                  className="flex border-b border-gray-200"
                  style={{ height: MONTH_HEADER_HEIGHT }}
                >
                  {monthHeaders.map((mh, i) => (
                    <div
                      key={i}
                      className="shrink-0 flex items-center justify-center text-sm font-semibold text-gray-700 border-r border-gray-100 capitalize"
                      style={{ width: mh.span * unitWidth }}
                    >
                      {mh.label}
                    </div>
                  ))}
                </div>
              )}

              {/* Time header */}
              <div
                className="flex border-b border-gray-200"
                style={{ height: HEADER_HEIGHT }}
              >
                {columns.map((col, i) => (
                  <div
                    key={i}
                    className={`shrink-0 flex flex-col items-center justify-center border-r border-gray-100 text-sm ${
                      col.isToday
                        ? "bg-green/10 font-semibold"
                        : "text-gray-500"
                    }`}
                    style={{ width: unitWidth }}
                  >
                    <span className="capitalize">{col.label}</span>
                    {col.sublabel && (
                      <span className="text-xs text-gray-400">
                        {col.sublabel}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {rows.map((row) => (
                <div
                  key={row.vehicle.id}
                  className="relative border-b border-gray-100"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {columns.map((col, i) => (
                      <div
                        key={i}
                        className={`shrink-0 border-r border-gray-50 ${
                          col.isToday ? "bg-green/5" : ""
                        }`}
                        style={{ width: unitWidth }}
                      />
                    ))}
                  </div>

                  {/* Booking bars */}
                  {row.bookings.map((b) => {
                    if (!isVisible(b.startDate, b.endDate)) return null;
                    const bar = getBarStyle(b.startDate, b.endDate);
                    const { label, colors } = getBookingDisplayStatus(b, now);
                    const startMs = new Date(b.startDate).getTime();
                    const endMs = new Date(b.endDate).getTime();
                    const pct =
                      now <= startMs
                        ? 0
                        : now >= endMs
                          ? 100
                          : Math.round(
                              ((now - startMs) / (endMs - startMs)) * 100
                            );

                    return (
                      <div
                        key={b.id}
                        className="absolute top-2 rounded-md cursor-pointer hover:brightness-95 transition-all z-5 shadow-sm"
                        style={{
                          left: bar.left,
                          width: bar.width,
                          height: ROW_HEIGHT - 16,
                          backgroundColor: colors.bg,
                        }}
                        onClick={() =>
                          router.push(`/admin/reservations/${b.id}`)
                        }
                        onMouseEnter={(e) => handleBarMouseEnter(e, b.id)}
                        onMouseLeave={() => setHoveredBooking(null)}
                      >
                        <div className="px-2 py-1 h-full flex flex-col justify-center overflow-hidden rounded-md">
                          <div
                            className="text-sm font-semibold truncate"
                            style={{ color: colors.text }}
                          >
                            {b.customerFirstName} {b.customerLastName}
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
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
