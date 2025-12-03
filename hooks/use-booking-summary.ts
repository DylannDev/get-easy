import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import type { Vehicle } from "@/types";
import {
  generateTimeSlots,
  calculateTotalPrice,
  formatDateTimeFR,
  getAvailableEndTimeSlots,
} from "@/lib/utils";
import { getBlockedDatesForVehicle } from "@/lib/availability";
import type { VehicleBooking } from "@/actions/get-vehicle-bookings";

interface UseBookingSummaryProps {
  vehicle: Vehicle;
  startDate: Date;
  endDate: Date;
  bookings?: VehicleBooking[];
}

export const useBookingSummary = ({
  vehicle,
  startDate,
  endDate,
  bookings = [],
}: UseBookingSummaryProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  const [startTime, setStartTime] = useState(
    `${startDate.getHours().toString().padStart(2, "0")}:${startDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`
  );

  const [endTime, setEndTime] = useState(
    `${endDate.getHours().toString().padStart(2, "0")}:${endDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`
  );

  const [openStartCalendar, setOpenStartCalendar] = useState(false);
  const [openEndCalendar, setOpenEndCalendar] = useState(false);

  // Génère les créneaux horaires (8:00 - 19:00 par défaut)
  const timeSlots = useMemo(() => {
    return generateTimeSlots({
      openTime: "08:00",
      closeTime: "19:00",
      interval: 30,
    });
  }, []);

  // Filtre les heures de retour pour same-day booking
  const availableEndTimeSlots = useMemo(() => {
    return getAvailableEndTimeSlots(
      dateRange?.from,
      dateRange?.to,
      startTime,
      timeSlots
    );
  }, [dateRange?.from, dateRange?.to, startTime, timeSlots]);

  // Obtenir toutes les dates bloquées (blocked_periods + bookings actifs)
  const blockedDates = useMemo(() => {
    return getBlockedDatesForVehicle(vehicle, bookings);
  }, [vehicle, bookings]);

  // Vérifie si une plage de dates chevauche une période bloquée
  // Retourne aussi les dates de la période bloquée qui chevauche
  const rangeOverlapsBlockedPeriod = (
    from: Date,
    to: Date
  ): { overlaps: boolean; blockedStart?: Date; blockedEnd?: Date } => {
    const normalizedFrom = new Date(from);
    const normalizedTo = new Date(to);
    normalizedFrom.setHours(0, 0, 0, 0);
    normalizedTo.setHours(0, 0, 0, 0);

    // Vérifie si au moins une date bloquée se trouve dans la plage
    const overlappingDates = blockedDates.filter((blockedDate) => {
      const d = new Date(blockedDate);
      d.setHours(0, 0, 0, 0);
      return d >= normalizedFrom && d <= normalizedTo;
    });

    if (overlappingDates.length === 0) {
      return { overlaps: false };
    }

    // Trouve la plage continue de dates bloquées qui chevauche
    const sortedDates = overlappingDates
      .map((d) => {
        const normalized = new Date(d);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
      })
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      overlaps: true,
      blockedStart: sortedDates[0],
      blockedEnd: sortedDates[sortedDates.length - 1],
    };
  };

  // Vérifie si une date est bloquée (prend en compte blocked_periods + bookings)
  const isDateBlocked = (date: Date): boolean => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return blockedDates.some((blockedDate) => {
      const blocked = new Date(blockedDate);
      blocked.setHours(0, 0, 0, 0);
      return d.getTime() === blocked.getTime();
    });
  };

  // Désactive les dates de retour invalides: passées, bloquées, ou < date de départ
  // IMPORTANT: Permet le same-day booking (date retour >= date départ)
  const isEndDateDisabled = (date: Date): boolean => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    if (date < today) return true;
    if (isDateBlocked(date)) return true;
    if (dateRange?.from) {
      const startDay = new Date(dateRange.from);
      startDay.setHours(0, 0, 0, 0);
      // Permet le même jour (>= au lieu de >)
      if (date < startDay) return true;
    }
    return false;
  };

  // Gère le changement de la date de départ
  const handleStartDateChange = (range: DateRange | undefined) => {
    if (!range?.from) return;

    const newFrom = new Date(range.from);
    newFrom.setHours(0, 0, 0, 0);

    // Si on a une date de retour, vérifie si la nouvelle plage est valide
    if (dateRange?.to) {
      const currentTo = new Date(dateRange.to);
      currentTo.setHours(0, 0, 0, 0);

      // Si la nouvelle date de départ est après la date de retour, réinitialise la date de retour
      if (newFrom > currentTo) {
        setDateRange({ from: range.from, to: undefined });
      } else {
        const overlap = rangeOverlapsBlockedPeriod(newFrom, currentTo);
        if (overlap.overlaps) {
          // Si le nouveau range chevauche une période bloquée, réinitialise la date de retour
          // L'utilisateur peut sélectionner n'importe quelle date de départ disponible
          setDateRange({ from: range.from, to: undefined });
        } else {
          // Le nouveau range est valide, on l'applique
          setDateRange({ from: range.from, to: dateRange.to });
        }
      }
    } else {
      // Pas de date de retour, on met juste à jour la date de départ
      setDateRange({ from: range.from, to: undefined });
    }

    setOpenStartCalendar(false);
  };

  // Gère le changement de la date de retour (mode range)
  const handleEndDateChange = (range: DateRange | undefined) => {
    if (!range) return;

    // En mode range, on peut avoir soit from, soit from + to
    // Si c'est le premier clic, range.from est la nouvelle date de retour
    // Si c'est le deuxième clic, range.to est la nouvelle date de retour
    const newTo = range.to || range.from;
    if (!newTo) return;

    const normalizedNewTo = new Date(newTo);
    normalizedNewTo.setHours(0, 0, 0, 0);

    // Si on a une date de départ, vérifie si la nouvelle plage est valide
    if (dateRange?.from) {
      const currentFrom = new Date(dateRange.from);
      currentFrom.setHours(0, 0, 0, 0);

      // Vérifie que la date de retour est après ou égale à la date de départ (same-day autorisé)
      if (normalizedNewTo >= currentFrom) {
        // Vérifie si la nouvelle plage chevauche une période bloquée
        const overlap = rangeOverlapsBlockedPeriod(
          currentFrom,
          normalizedNewTo
        );
        if (!overlap.overlaps) {
          setDateRange({ from: dateRange.from, to: newTo });
          // Ferme le calendrier uniquement si on a une plage complète
          if (range.to) {
            setOpenEndCalendar(false);
          }
        } else {
          // Message détaillé avec les dates bloquées (pas les dates sélectionnées)
          if (overlap.blockedStart && overlap.blockedEnd) {
            // Utilise les heures par défaut (08:00) pour les dates bloquées
            const blockedStartWithTime = new Date(overlap.blockedStart);
            blockedStartWithTime.setHours(8, 0, 0, 0);

            const blockedEndWithTime = new Date(overlap.blockedEnd);
            blockedEndWithTime.setHours(19, 0, 0, 0);

            const formattedBlockedStart =
              formatDateTimeFR(blockedStartWithTime);
            const formattedBlockedEnd = formatDateTimeFR(blockedEndWithTime);

            toast.warning(
              `Ce véhicule est déjà réservé du ${formattedBlockedStart} au ${formattedBlockedEnd}. Veuillez sélectionner d'autres dates.`
            );
          }
        }
      }
    } else {
      // Pas de date de départ, on ferme juste le calendrier
      setOpenEndCalendar(false);
    }
  };

  // Calcule le nombre de jours et le prix total en tenant compte des heures
  const { numberOfDays, totalPrice } = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return { numberOfDays: 0, totalPrice: 0 };
    }

    // Crée les dates complètes avec les heures
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const fullStartDate = new Date(dateRange.from);
    fullStartDate.setHours(startHour, startMinute, 0, 0);

    const fullEndDate = new Date(dateRange.to);
    fullEndDate.setHours(endHour, endMinute, 0, 0);

    const result = calculateTotalPrice(
      fullStartDate,
      fullEndDate,
      vehicle.pricePerDay,
      vehicle.pricingTiers
    );
    return { numberOfDays: result.totalDays, totalPrice: result.totalPrice };
  }, [
    dateRange,
    startTime,
    endTime,
    vehicle.pricePerDay,
    vehicle.pricingTiers,
  ]);

  // Met à jour les paramètres URL quand les dates ou heures changent
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const newStartDate = new Date(dateRange.from);
      newStartDate.setHours(startHour, startMinute, 0, 0);

      const newEndDate = new Date(dateRange.to);
      newEndDate.setHours(endHour, endMinute, 0, 0);

      const newStartISO = newStartDate.toISOString();
      const newEndISO = newEndDate.toISOString();

      // Met à jour uniquement si les valeurs ont changé
      const currentStart = searchParams.get("start");
      const currentEnd = searchParams.get("end");

      if (currentStart !== newStartISO || currentEnd !== newEndISO) {
        const params = new URLSearchParams();
        params.set("start", newStartISO);
        params.set("end", newEndISO);

        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, startTime, endTime]);

  return {
    dateRange,
    startTime,
    endTime,
    timeSlots,
    availableEndTimeSlots,
    openStartCalendar,
    openEndCalendar,
    numberOfDays,
    totalPrice,
    setStartTime,
    setEndTime,
    setOpenStartCalendar,
    setOpenEndCalendar,
    handleStartDateChange,
    handleEndDateChange,
    isDateBlocked,
    isEndDateDisabled,
  };
};
