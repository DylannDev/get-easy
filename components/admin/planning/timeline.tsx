"use client";

import type { RefObject } from "react";
import type { PlanningVehicleRow } from "@/application/admin/get-planning-data.use-case";
import type { BookingWithDetails } from "@/domain/booking";
import {
  HEADER_HEIGHT,
  MONTH_HEADER_HEIGHT,
  ROW_HEIGHT,
  type ViewMode,
} from "./planning-constants";
import type { PlanningColumn } from "./use-planning-columns";
import { BookingBar } from "./booking-bar";
import { getBarStyle, isBookingVisible } from "./get-bar-style";

interface Props {
  scrollRef: RefObject<HTMLDivElement | null>;
  rows: PlanningVehicleRow[];
  columns: PlanningColumn[];
  rangeStart: Date;
  rangeEnd: Date;
  unitWidth: number;
  totalWidth: number;
  viewMode: ViewMode;
  monthHeaders: { label: string; span: number }[];
  todayMarkerLeft: number | null;
  now: number;
  onBookingHover: (
    e: React.MouseEvent<HTMLDivElement>,
    booking: BookingWithDetails,
  ) => void;
  onBookingLeave: () => void;
}

/** Partie scrollable du Gantt : en-tête mois (en day/week) + en-tête colonnes
 *  (jour/semaine/mois/année), une ligne de grille + barres par véhicule, et
 *  le marqueur "Aujourd'hui" superposé. */
export function Timeline({
  scrollRef,
  rows,
  columns,
  rangeStart,
  rangeEnd,
  unitWidth,
  totalWidth,
  viewMode,
  monthHeaders,
  todayMarkerLeft,
  now,
  onBookingHover,
  onBookingLeave,
}: Props) {
  const hasMonthHeader = monthHeaders.length > 0;
  const fullHeaderHeight = hasMonthHeader
    ? HEADER_HEIGHT + MONTH_HEADER_HEIGHT
    : HEADER_HEIGHT;

  return (
    <div ref={scrollRef} className="overflow-x-auto flex-1">
      <div className="relative" style={{ width: totalWidth, minWidth: "100%" }}>
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

        <div
          className="flex border-b border-gray-200"
          style={{ height: HEADER_HEIGHT }}
        >
          {columns.map((col, i) => (
            <div
              key={i}
              className={`shrink-0 flex flex-col items-center justify-center border-r border-gray-100 text-sm ${
                col.isToday ? "bg-green/10 font-semibold" : "text-gray-500"
              }`}
              style={{ width: unitWidth }}
            >
              <span className="capitalize">{col.label}</span>
              {col.sublabel && (
                <span className="text-xs text-gray-400">{col.sublabel}</span>
              )}
            </div>
          ))}
        </div>

        {rows.map((row) => (
          <div
            key={row.vehicle.id}
            className="relative border-b border-gray-100"
            style={{ height: ROW_HEIGHT }}
          >
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

            {row.bookings.map((b) => {
              if (!isBookingVisible(b.startDate, b.endDate, rangeStart, rangeEnd))
                return null;
              const bar = getBarStyle({
                startDate: b.startDate,
                endDate: b.endDate,
                rangeStart,
                rangeEnd,
                unitWidth,
                totalWidth,
                viewMode,
              });
              return (
                <BookingBar
                  key={b.id}
                  booking={b}
                  now={now}
                  left={bar.left}
                  width={bar.width}
                  onMouseEnter={(e) => onBookingHover(e, b)}
                  onMouseLeave={onBookingLeave}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
