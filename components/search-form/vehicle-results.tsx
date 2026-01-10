import type { Vehicle } from "@/types";
import type { DateRange } from "react-day-picker";
import { VehicleCard } from "@/components/vehicle-card/vehicle-card";
import { LoadingSpinner } from "../loading-spinner";
import { groupVehicles } from "@/lib/group-vehicles";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createInitiatedBooking } from "@/actions/create-initiated-booking";
import { toast } from "sonner";

interface VehicleResultsProps {
  vehicles: Vehicle[];
  isSubmitted: boolean;
  isSubmitting: boolean;
  dateRange?: DateRange;
  startTime?: string;
  endTime?: string;
}

export const VehicleResults = ({
  vehicles,
  isSubmitted,
  isSubmitting,
  dateRange,
  startTime,
  endTime,
}: VehicleResultsProps) => {
  // Regrouper les véhicules identiques
  const groupedVehicles = useMemo(() => groupVehicles(vehicles), [vehicles]);

  if (!isSubmitted) {
    return (
      <>
        <div className="mb-4 text-xl sm:text-3xl font-semibold text-black font-title">
          <span>Tous nos véhicules ({vehicles.length})</span>
        </div>

        <VehicleGrid
          vehicles={groupedVehicles}
          dateRange={dateRange}
          startTime={startTime}
          endTime={endTime}
          onClickWithoutDates={() =>
            toast.warning("Veuillez sélectionner vos dates de location.")
          }
        />
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl sm:text-3xl font-semibold mb-6 text-center sm:text-left">
        Sélectionnez votre véhicule
      </h1>
      {isSubmitting ? (
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
  const router = useRouter();
  const [isCreatingBooking, setIsCreatingBooking] = useState<string | null>(
    null
  );

  const hasDates = dateRange?.from && dateRange?.to && startTime && endTime;

  // Fonction pour gérer le clic sur une carte de véhicule
  const handleVehicleClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
    vehicle: Vehicle
  ) => {
    // Ne pas déclencher la réservation si on clique sur le bouton info ou le popover
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-popover-trigger]") ||
      target.closest("[data-radix-popper-content-wrapper]")
    ) {
      e.preventDefault();
      return;
    }

    if (!hasDates) {
      onClickWithoutDates?.();
      return;
    }

    // Créer les dates complètes avec heures
    if (!dateRange.from || !dateRange.to) return;

    const [startHour, startMinute] = startTime!.split(":").map(Number);
    const [endHour, endMinute] = endTime!.split(":").map(Number);

    const startDateTime = new Date(dateRange.from);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(dateRange.to);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    const startISO = startDateTime.toISOString();
    const endISO = endDateTime.toISOString();

    // Afficher un état de chargement pour cette carte
    setIsCreatingBooking(vehicle.id);

    try {
      // Appeler la server action pour créer le booking "initiated"
      const result = await createInitiatedBooking({
        vehicleId: vehicle.id,
        startDate: startISO,
        endDate: endISO,
      });

      if (!result.success || !result.bookingId) {
        toast.error(result.error || "Impossible de créer la réservation");
        setIsCreatingBooking(null);
        return;
      }

      // Rediriger vers la page de réservation avec le bookingId
      router.push(
        `/booking/${vehicle.id}?start=${startISO}&end=${endISO}&bookingId=${result.bookingId}`
      );
    } catch (error) {
      console.error("Erreur lors de la création du booking:", error);
      toast.error("Une erreur inattendue s'est produite");
      setIsCreatingBooking(null);
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
        <button
          key={v.id}
          type="button"
          onClick={(e) => handleVehicleClick(e, v)}
          disabled={isCreatingBooking === v.id}
          className="text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <VehicleCard
            vehicle={v}
            startDate={startDateTime}
            endDate={endDateTime}
          />
        </button>
      ))}
    </div>
  );
};
