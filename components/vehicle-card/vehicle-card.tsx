"use client";

import Image from "next/image";
import type { Vehicle } from "@/types";
import type { GroupedVehicle } from "@/lib/group-vehicles";
import {
  PiCalendarDuotone,
  PiChargingStationDuotone,
  PiGasPumpDuotone,
  PiGearDuotone,
  PiUsersDuotone,
} from "react-icons/pi";
import { VehicleDetail } from "./vehicle-detail";
import { calculateTotalPrice } from "@/lib/utils";

interface VehicleCardProps {
  vehicle: Vehicle | GroupedVehicle;
  startDate?: Date;
  endDate?: Date;
}

const isGroupedVehicle = (
  vehicle: Vehicle | GroupedVehicle
): vehicle is GroupedVehicle => {
  return "count" in vehicle;
};

export const VehicleCard = ({ vehicle, startDate, endDate }: VehicleCardProps) => {
  const count = isGroupedVehicle(vehicle) ? vehicle.count : 1;
  const showBadge = count > 1;

  // Calcul du nombre de jours et du prix total si les dates sont fournies
  const hasDates = startDate && endDate;
  let totalDays = 0;
  let totalPrice = 0;

  if (hasDates) {
    const result = calculateTotalPrice(startDate, endDate, vehicle.pricePerDay);
    totalDays = result.totalDays;
    totalPrice = result.totalPrice;
  }

  return (
    <article className="relative flex flex-col justify-between rounded-xl border border-gray-300 bg-white p-6 cursor-pointer overflow-hidden">
      {/* Badge disponibilité */}
      {showBadge && (
        <div className="absolute top-0 right-0 bg-green text-black text-xs font-semibold px-2 py-1 rounded-bl-md z-10">
          {count} véhicules disponibles
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-2xl font-semibold">
          {vehicle.brand} {vehicle.model}
        </h3>

        {/* Price */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg">
            {hasDates ? (
              <>
                <span className="text-2xl font-bold">{totalPrice}€</span>
                <span className="text-gray-600"> pour {totalDays} jour{totalDays > 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <span className="text-gray-600">À partir de </span>
                <span className="text-2xl font-bold">{vehicle.pricePerDay}€</span>
                <span className="text-gray-600"> / jour</span>
              </>
            )}
          </div>
        </div>

        {/* Vehicle Image */}
        <div className="relative aspect-square w-full h-full max-h-60 overflow-hidden rounded-xl">
          <Image
            src={vehicle.img}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover"
          />
        </div>

        {/* Vehicle details */}
        <div className="flex justify-between gap-2 text-sm text-gray-600  capitalize">
          <VehicleDetail
            icon={PiUsersDuotone}
            label={`${vehicle.numberOfSeats} places`}
          />
          <VehicleDetail icon={PiGearDuotone} label={vehicle.transmission} />
          <VehicleDetail
            icon={
              vehicle.fuelType === "diesel" || vehicle.fuelType === "essence"
                ? PiGasPumpDuotone
                : PiChargingStationDuotone
            }
            label={vehicle.fuelType}
          />
          <VehicleDetail
            icon={PiCalendarDuotone}
            label={vehicle.year.toString()}
          />
        </div>
      </div>
    </article>
  );
};
