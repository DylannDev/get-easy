import { useState, useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import type { Vehicle } from "@/types";
import type { Database } from "@/lib/supabase/database.types";
import {
  generateTimeSlots,
  calculateTotalPrice,
  formatDateTimeFR,
  getAvailableEndTimeSlots,
  getAvailableStartTimeSlots,
  isTodayDisabledForBooking,
} from "@/lib/utils";
import { getBlockedDatesForVehicle } from "@/lib/availability";
import type { VehicleBooking } from "@/actions/get-vehicle-bookings";

type Agency = Database["public"]["Tables"]["agencies"]["Row"];

interface UseBookingSummaryProps {
  vehicle: Vehicle;
  agency: Agency;
  startDate: Date;
  endDate: Date;
  bookings?: VehicleBooking[];
}

export const useBookingSummary = ({
  vehicle,
  agency,
  startDate,
  endDate,
  bookings = [],
}: UseBookingSummaryProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Récupérer le bookingId depuis l'URL pour ignorer ce booking dans les vérifications
  const currentBookingId = searchParams.get("bookingId");

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  // Génère les créneaux horaires depuis les horaires de l'agence
  const timeSlots = useMemo(() => {
    return generateTimeSlots({
      openTime: agency.open_time,
      closeTime: agency.close_time,
      interval: agency.interval,
    });
  }, [agency.open_time, agency.close_time, agency.interval]);

  // Fonction pour trouver l'heure valide la plus proche ou la première disponible
  const findValidTimeSlot = (targetTime: string, slots: string[]): string => {
    if (slots.length === 0) return "08:00"; // Fallback de sécurité

    // Si l'heure cible est dans les slots, on la garde
    if (slots.includes(targetTime)) {
      return targetTime;
    }

    // Sinon, chercher l'heure la plus proche
    const [targetHour, targetMinute] = targetTime.split(":").map(Number);
    const targetMinutes = targetHour * 60 + targetMinute;

    let closestSlot = slots[0];
    let minDiff = Infinity;

    for (const slot of slots) {
      const [slotHour, slotMinute] = slot.split(":").map(Number);
      const slotMinutes = slotHour * 60 + slotMinute;
      const diff = Math.abs(slotMinutes - targetMinutes);

      if (diff < minDiff) {
        minDiff = diff;
        closestSlot = slot;
      }
    }

    return closestSlot;
  };

  const [startTime, setStartTime] = useState(() => {
    const targetTime = `${startDate.getHours().toString().padStart(2, "0")}:${startDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return findValidTimeSlot(targetTime, timeSlots);
  });

  const [endTime, setEndTime] = useState(() => {
    const targetTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return findValidTimeSlot(targetTime, timeSlots);
  });

  const [openStartCalendar, setOpenStartCalendar] = useState(false);
  const [openEndCalendar, setOpenEndCalendar] = useState(false);

  // Filtre les heures de départ en fonction de la date sélectionnée
  // Si c'est aujourd'hui, on ne montre que les heures futures
  const availableStartTimeSlots = useMemo(() => {
    return getAvailableStartTimeSlots(dateRange?.from, timeSlots);
  }, [dateRange?.from, timeSlots]);

  // Détermine si la date du jour doit être désactivée (aucun créneau disponible)
  const isTodayDisabled = useMemo(() => {
    return isTodayDisabledForBooking(timeSlots);
  }, [timeSlots]);

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
  // En excluant le booking courant (celui de l'URL) pour permettre à l'utilisateur
  // de modifier ses dates sans être bloqué par sa propre réservation
  const blockedDates = useMemo(() => {
    return getBlockedDatesForVehicle(vehicle, bookings, currentBookingId);
  }, [vehicle, bookings, currentBookingId]);

  // Vérifie si une plage de dates chevauche une période bloquée
  // Retourne aussi les dates réelles (avec heures) de la période bloquée qui chevauche
  const rangeOverlapsBlockedPeriod = (
    from: Date,
    to: Date
  ): { overlaps: boolean; blockedStart?: Date; blockedEnd?: Date } => {
    const normalizedFrom = new Date(from);
    const normalizedTo = new Date(to);
    normalizedFrom.setHours(0, 0, 0, 0);
    normalizedTo.setHours(0, 0, 0, 0);

    // 1. Vérifie les blocked_periods du véhicule
    for (const blocked of vehicle.blockedPeriods) {
      let blockedStart = new Date(blocked.start);
      let blockedEnd = new Date(blocked.end);

      // Corrige les périodes inversées
      if (blockedStart > blockedEnd) {
        [blockedStart, blockedEnd] = [blockedEnd, blockedStart];
      }

      const normalizedBlockedStart = new Date(blockedStart);
      const normalizedBlockedEnd = new Date(blockedEnd);
      normalizedBlockedStart.setHours(0, 0, 0, 0);
      normalizedBlockedEnd.setHours(0, 0, 0, 0);

      // Vérifie le chevauchement
      if (
        normalizedFrom <= normalizedBlockedEnd &&
        normalizedTo >= normalizedBlockedStart
      ) {
        return {
          overlaps: true,
          blockedStart: blockedStart, // Retourne avec les vraies heures
          blockedEnd: blockedEnd, // Retourne avec les vraies heures
        };
      }
    }

    // 2. Vérifie les bookings actifs (paid ou pending_payment)
    for (const booking of bookings) {
      if (!["pending_payment", "paid"].includes(booking.status)) {
        continue;
      }

      // Ignorer le booking courant (celui de l'URL)
      // pour permettre à l'utilisateur de modifier ses dates sans être bloqué par sa propre réservation
      if (currentBookingId && booking.id === currentBookingId) {
        continue;
      }

      let bookingStart = new Date(booking.start_date);
      let bookingEnd = new Date(booking.end_date);

      // Corrige les périodes inversées
      if (bookingStart > bookingEnd) {
        [bookingStart, bookingEnd] = [bookingEnd, bookingStart];
      }

      const normalizedBookingStart = new Date(bookingStart);
      const normalizedBookingEnd = new Date(bookingEnd);
      normalizedBookingStart.setHours(0, 0, 0, 0);
      normalizedBookingEnd.setHours(0, 0, 0, 0);

      // Vérifie le chevauchement
      if (
        normalizedFrom <= normalizedBookingEnd &&
        normalizedTo >= normalizedBookingStart
      ) {
        return {
          overlaps: true,
          blockedStart: bookingStart, // Retourne avec les vraies heures
          blockedEnd: bookingEnd, // Retourne avec les vraies heures
        };
      }
    }

    return { overlaps: false };
  };

  // Vérifie si une date est bloquée (prend en compte blocked_periods + bookings + today si aucun créneau disponible)
  const isDateBlocked = (date: Date): boolean => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    // Vérifier si c'est aujourd'hui et s'il n'y a aucun créneau disponible
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime() && isTodayDisabled) {
      return true;
    }

    // Vérifier les dates bloquées (blocked_periods + bookings)
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
          // Message détaillé avec les dates bloquées (avec les vraies heures depuis la BDD)
          if (overlap.blockedStart && overlap.blockedEnd) {
            const formattedBlockedStart = formatDateTimeFR(overlap.blockedStart);
            const formattedBlockedEnd = formatDateTimeFR(overlap.blockedEnd);

            toast.error(
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
    availableStartTimeSlots,
    availableEndTimeSlots,
    isTodayDisabled,
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
