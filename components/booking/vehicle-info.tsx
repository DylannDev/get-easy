import Image from "next/image";
import type { Vehicle } from "@/types";
import {
  PiCalendarDuotone,
  PiChargingStationDuotone,
  PiGasPumpDuotone,
  PiGearDuotone,
  PiUsersDuotone,
  PiSuitcaseDuotone,
  PiCarDuotone,
} from "react-icons/pi";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { addImageCacheBusting } from "@/lib/utils";

interface VehicleInfoProps {
  vehicle: Vehicle;
}

export const VehicleInfo = ({ vehicle }: VehicleInfoProps) => {
  return (
    <div className="space-y-6">
      {/* Vehicle Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white border border-gray-300 flex items-center justify-center">
        <div className="relative h-full w-full sm:w-[70%] sm:h-[70%]">
          <Image
            src={addImageCacheBusting(vehicle.img)}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover rounded-xl"
            priority
          />
        </div>
      </div>

      {/* Vehicle Title */}
      <div>
        <h1 className="text-3xl font-bold">
          {vehicle.brand} {vehicle.model}
        </h1>
      </div>

      {/* Technical Details */}
      <Card>
        <CardTitle>Détails techniques</CardTitle>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <DetailItem
              icon={
                vehicle.fuelType === "diesel" || vehicle.fuelType === "essence"
                  ? PiGasPumpDuotone
                  : PiChargingStationDuotone
              }
              value={vehicle.fuelType}
            />
            <DetailItem
              icon={PiUsersDuotone}
              value={`${vehicle.numberOfSeats} places`}
            />

            <DetailItem icon={PiGearDuotone} value={vehicle.transmission} />

            <DetailItem
              icon={PiCalendarDuotone}
              value={vehicle.year.toString()}
            />
            <DetailItem
              icon={PiCarDuotone}
              value={`${vehicle.numberOfDoors} portes`}
            />
            <DetailItem icon={PiSuitcaseDuotone} value={vehicle.trunkSize} />
          </div>
        </CardContent>
      </Card>

      {/* Rental Conditions */}
      <Card>
        <CardTitle>Conditions de location</CardTitle>
        <CardContent>
          <div className="space-y-3 text-sm">
            <ConditionItem label="Kilomètrage inclus" value="100 km/jour" />
            {/* <ConditionItem label="Assurance incluse" value="Tout risque" /> */}
            <ConditionItem label="Âge minimum" value="23 ans" />
            <ConditionItem label="Permis" value="B / B1 (3 ans minimum)" />
            <ConditionItem label="Caution" value="1 000,00 €" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DetailItem = ({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}) => (
  <div className="flex flex-col min-[490px]:flex-row items-center gap-2">
    <div className="bg-black rounded-lg p-2">
      <Icon className="size-5 text-green" />
    </div>
    <span className="text-sm sm:text-base text-gray-600 capitalize">
      {value}
    </span>
  </div>
);

const ConditionItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);
