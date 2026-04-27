"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { addMonths, startOfMonth } from "date-fns";
import type { PlanningVehicleRow } from "@/application/admin/get-planning-data.use-case";
import type { BookingWithDetails } from "@/domain/booking";
import {
  HEADER_HEIGHT,
  MONTH_HEADER_HEIGHT,
  UNIT_WIDTH,
  type ViewMode,
} from "./planning-constants";
import { usePlanningColumns } from "./use-planning-columns";
import { getTodayMarkerLeft } from "./get-bar-style";
import { PlanningToolbar } from "./planning-toolbar";
import { VehicleColumn } from "./vehicle-column";
import { Timeline } from "./timeline";
import { FloatingTooltip } from "./floating-tooltip";

interface Props {
  rows: PlanningVehicleRow[];
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/** Wrapper SSR-safe : le planning utilise des `DOMRect` et `createPortal`
 *  (mesures DOM + portail), il ne doit s'hydrater qu'après le mount. */
export function PlanningView({ rows }: Props) {
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  if (!mounted) return <div style={{ height: 400 }} />;
  return <PlanningViewInner rows={rows} />;
}

interface HoveredBooking {
  booking: BookingWithDetails;
  rect: DOMRect;
  containerRect: DOMRect;
}

function PlanningViewInner({ rows }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [anchorDate, setAnchorDate] = useState(() => startOfMonth(new Date()));
  const [hoveredBooking, setHoveredBooking] = useState<HoveredBooking | null>(
    null,
  );
  const [now] = useState(() => Date.now());

  const { columns, rangeStart, rangeEnd, periodLabel, monthHeaders } =
    usePlanningColumns(rows, anchorDate, viewMode);

  const unitWidth = UNIT_WIDTH[viewMode];
  const totalWidth = columns.length * unitWidth;
  const hasMonthHeader = monthHeaders.length > 0;
  const fullHeaderHeight = hasMonthHeader
    ? HEADER_HEIGHT + MONTH_HEADER_HEIGHT
    : HEADER_HEIGHT;

  // Auto-scroll sur la colonne d'aujourd'hui en vue jour.
  useEffect(() => {
    if (!scrollRef.current || viewMode !== "day") return;
    const todayIdx = columns.findIndex((c) => c.isToday);
    if (todayIdx > 0) {
      scrollRef.current.scrollLeft = todayIdx * unitWidth - 100;
    }
  }, [columns, unitWidth, viewMode]);

  const todayMarkerLeft = useMemo(
    () =>
      getTodayMarkerLeft(
        columns,
        rangeStart,
        rangeEnd,
        unitWidth,
        totalWidth,
        viewMode,
      ),
    [columns, rangeStart, rangeEnd, unitWidth, totalWidth, viewMode],
  );

  const handleNavigate = (dir: 1 | -1) => {
    if (viewMode === "day" || viewMode === "week") {
      setAnchorDate((d) => addMonths(d, dir));
    }
  };

  const handleBookingHover = (
    e: React.MouseEvent<HTMLDivElement>,
    booking: BookingWithDetails,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cRect = containerRef.current?.getBoundingClientRect();
    if (cRect) setHoveredBooking({ booking, rect, containerRect: cRect });
  };

  const showNav = viewMode === "day" || viewMode === "week";

  return (
    <div className="space-y-4" ref={containerRef}>
      {hoveredBooking && (
        <FloatingTooltip
          booking={hoveredBooking.booking}
          anchorRect={hoveredBooking.rect}
          containerRect={hoveredBooking.containerRect}
          now={now}
        />
      )}

      <PlanningToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        periodLabel={periodLabel}
        onNavigate={handleNavigate}
        showNav={showNav}
      />

      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="flex">
          <VehicleColumn rows={rows} headerHeight={fullHeaderHeight} />
          <Timeline
            scrollRef={scrollRef}
            rows={rows}
            columns={columns}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            unitWidth={unitWidth}
            totalWidth={totalWidth}
            viewMode={viewMode}
            monthHeaders={monthHeaders}
            todayMarkerLeft={todayMarkerLeft}
            now={now}
            onBookingHover={handleBookingHover}
            onBookingLeave={() => setHoveredBooking(null)}
          />
        </div>
      </div>
    </div>
  );
}
