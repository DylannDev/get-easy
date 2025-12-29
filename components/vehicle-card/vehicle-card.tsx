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
  PiInfoDuotone,
} from "react-icons/pi";
import { VehicleDetail } from "./vehicle-detail";
import { calculateTotalPrice, addImageCacheBusting } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

export const VehicleCard = ({
  vehicle,
  startDate,
  endDate,
}: VehicleCardProps) => {
  const count = isGroupedVehicle(vehicle) ? vehicle.count : 1;
  const showBadge = count > 1;

  // Calcul du nombre de jours et du prix total si les dates sont fournies
  const hasDates = startDate && endDate;
  let totalDays = 0;
  let totalPrice = 0;

  if (hasDates) {
    const result = calculateTotalPrice(
      startDate,
      endDate,
      vehicle.pricePerDay,
      vehicle.pricingTiers
    );
    totalDays = result.totalDays;
    totalPrice = result.totalPrice;
  }

  // Prix le plus bas (dernier palier)
  const lowestPricePerDay = vehicle.pricingTiers
    ? vehicle.pricingTiers[vehicle.pricingTiers.length - 1].pricePerDay
    : vehicle.pricePerDay;

  return (
    <article className="relative flex flex-col justify-between rounded-xl border border-gray-300 bg-white px-6 py-8 cursor-pointer overflow-hidden">
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
        <div className="mt-4 flex items-start">
          <div className="text-lg">
            {hasDates ? (
              <>
                <span className="text-2xl font-bold">{totalPrice}€</span>
                <span className="text-gray-600">
                  {" "}
                  pour {totalDays} jour{totalDays > 1 ? "s" : ""}
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-600">À partir de </span>
                <span className="text-2xl font-bold">{lowestPricePerDay}€</span>
                <span className="text-gray-600"> / jour</span>
              </>
            )}
          </div>

          {/* Pricing tiers info popover */}
          {vehicle.pricingTiers && vehicle.pricingTiers.length > 0 && (
            <div className="relative z-10" data-popover-trigger>
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    className="text-black hover:text-green transition-colors p-2 cursor-pointer"
                    aria-label="Voir les tarifs par durée"
                  >
                    <PiInfoDuotone className="size-5" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-56 border border-gray-300">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Tarifs par durée :
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {vehicle.pricingTiers.map((tier, index) => (
                        <li key={index} className="flex justify-between">
                          <span className="text-gray-600">
                            {tier.minDays === 1
                              ? "1 jour"
                              : `${tier.minDays}+ jours`}
                          </span>
                          <span className="font-medium">
                            {tier.pricePerDay}€
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Vehicle Image */}
        <div className="relative aspect-video w-full h-full overflow-hidden rounded-xl">
          <Image
            src={addImageCacheBusting(vehicle.img)}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover md:scale-110"
          />
        </div>

        {/* Vehicle details */}
        <div className="flex justify-between gap-2 text-sm text-gray-600 capitalize">
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
