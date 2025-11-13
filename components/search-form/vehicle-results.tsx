import type { Vehicle } from "@/types";
import type { DateRange } from "react-day-picker";
import { VehicleCard } from "@/components/vehicle-card/vehicle-card";
import { LoadingSpinner } from "../loading-spinner";
import { groupVehicles } from "@/lib/group-vehicles";
import { useMemo, useState } from "react";
import Link from "next/link";

interface VehicleResultsProps {
  vehicles: Vehicle[];
  isSubmitted: boolean;
  isLoading: boolean;
  dateRange?: DateRange;
  startTime?: string;
  endTime?: string;
}

export const VehicleResults = ({
  vehicles,
  isSubmitted,
  isLoading,
  dateRange,
  startTime,
  endTime,
}: VehicleResultsProps) => {
  // Regrouper les véhicules identiques
  const groupedVehicles = useMemo(() => groupVehicles(vehicles), [vehicles]);
  const [showError, setShowError] = useState(false);

  if (!isSubmitted) {
    // Check if dates are provided
    const hasDates = dateRange?.from && dateRange?.to && startTime && endTime;

    return (
      <>
        {showError && !hasDates && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 w-fit">
            Veuillez sélectionner vos dates de location.
          </div>
        )}
        <div className="mb-3 text-lg font-medium text-black font-title">
          <span>Tous nos véhicules ({vehicles.length})</span>
        </div>

        <VehicleGrid
          vehicles={groupedVehicles}
          dateRange={dateRange}
          startTime={startTime}
          endTime={endTime}
          onClickWithoutDates={() => setShowError(true)}
        />
      </>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Sélectionnez votre véhicule</h1>
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <VehicleGrid
          vehicles={groupedVehicles}
          dateRange={dateRange}
          startTime={startTime}
          endTime={endTime}
        />
      )}
    </>
  );
};

const VehicleGrid = ({
  vehicles,
  dateRange,
  startTime,
  endTime,
  onClickWithoutDates,
}: {
  vehicles: ReturnType<typeof groupVehicles>;
  dateRange?: DateRange;
  startTime?: string;
  endTime?: string;
  onClickWithoutDates?: () => void;
}) => {
  // Helper function to construct booking URL with date params
  const getBookingUrl = (vehicleId: string) => {
    // If dates and times are provided, construct URL with search params
    if (dateRange?.from && dateRange?.to && startTime && endTime) {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const startDateTime = new Date(dateRange.from);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(dateRange.to);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      const startISO = startDateTime.toISOString();
      const endISO = endDateTime.toISOString();

      return `/booking/${vehicleId}?start=${startISO}&end=${endISO}`;
    }

    // Otherwise, just return basic URL
    return `/booking/${vehicleId}`;
  };

  const hasDates = dateRange?.from && dateRange?.to && startTime && endTime;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hasDates) {
      e.preventDefault();
      onClickWithoutDates?.();
    }
  };

  // Calcul des dates complètes avec heures pour le VehicleCard
  let startDateTime: Date | undefined;
  let endDateTime: Date | undefined;

  if (dateRange?.from && dateRange?.to && startTime && endTime) {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    startDateTime = new Date(dateRange.from);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    endDateTime = new Date(dateRange.to);
    endDateTime.setHours(endHour, endMinute, 0, 0);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v) => (
        <Link key={v.id} href={getBookingUrl(v.id)} onClick={handleClick}>
          <VehicleCard
            vehicle={v}
            startDate={startDateTime}
            endDate={endDateTime}
          />
        </Link>
      ))}
    </div>
  );
};
