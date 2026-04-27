"use client";

import Image from "next/image";
import type { PlanningVehicleRow } from "@/application/admin/get-planning-data.use-case";
import {
  ROW_HEIGHT,
  VEHICLE_COL_WIDTH,
} from "./planning-constants";

interface Props {
  rows: PlanningVehicleRow[];
  headerHeight: number;
}

/** Colonne fixée à gauche du Gantt, listant les véhicules (image + marque /
 *  modèle / immat). Sa hauteur d'en-tête s'aligne sur celle de la timeline
 *  (`headerHeight`) pour que les lignes soient parfaitement alignées. */
export function VehicleColumn({ rows, headerHeight }: Props) {
  return (
    <div
      className="shrink-0 border-r border-gray-200 z-10"
      style={{ width: VEHICLE_COL_WIDTH }}
    >
      <div
        className="border-b border-gray-200 px-3 flex items-end pb-2 text-sm font-semibold text-gray-700"
        style={{ height: headerHeight }}
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
  );
}
