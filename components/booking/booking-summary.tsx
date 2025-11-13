"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import type { Vehicle } from "@/types";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/search-form/date-time-picker";
import { generateTimeSlots, calculateTotalPrice } from "@/lib/utils";
import { LoadingSpinner } from "@/components/loading-spinner";

interface BookingSummaryProps {
  vehicle: Vehicle;
  startDate: Date;
  endDate: Date;
  currentStep?: number;
  onProceedToForm?: () => void;
}

export const BookingSummary = ({
  vehicle,
  startDate,
  endDate,
  currentStep = 1,
  onProceedToForm,
}: BookingSummaryProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  // Vérifie si une plage de dates chevauche une période bloquée
  const rangeOverlapsBlockedPeriod = (from: Date, to: Date): boolean => {
    return vehicle.blockedPeriods.some((period) => {
      const blockStart = new Date(period.start);
      const blockEnd = new Date(period.end);
      blockStart.setHours(0, 0, 0, 0);
      blockEnd.setHours(0, 0, 0, 0);

      // Normalise les dates from et to
      const normalizedFrom = new Date(from);
      const normalizedTo = new Date(to);
      normalizedFrom.setHours(0, 0, 0, 0);
      normalizedTo.setHours(0, 0, 0, 0);

      // Un chevauchement existe si au moins une date de la réservation tombe dans la période bloquée
      // Réservation du 18/11 au 19/11 avec blocage du 20/11 au 22/11 : PAS de chevauchement (19 < 20)
      // Réservation du 19/11 au 20/11 avec blocage du 20/11 au 22/11 : chevauchement (le 20 est bloqué)
      return normalizedFrom <= blockEnd && normalizedTo >= blockStart;
    });
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
        // Vérifie si la nouvelle plage chevauche une période bloquée
        if (!rangeOverlapsBlockedPeriod(newFrom, currentTo)) {
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

      // Vérifie que la date de retour est après la date de départ
      if (normalizedNewTo > currentFrom) {
        // Vérifie si la nouvelle plage chevauche une période bloquée
        if (!rangeOverlapsBlockedPeriod(currentFrom, normalizedNewTo)) {
          setDateRange({ from: dateRange.from, to: newTo });
          // Ferme le calendrier uniquement si on a une plage complète
          if (range.to) {
            setOpenEndCalendar(false);
          }
        } else {
          // Message Sonner si la fin dépasse une période bloquée
          toast.warning(
            "Sélectionnez une date de retour avant la période bloquée."
          );
        }
      }
    } else {
      // Pas de date de départ, on ferme juste le calendrier
      setOpenEndCalendar(false);
    }
  };
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

  // Vérifie si une date est bloquée (normalisée à la journée, corrige les périodes inversées)
  const isDateBlocked = (date: Date): boolean => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return vehicle.blockedPeriods.some((period) => {
      let blockStart = new Date(period.start);
      let blockEnd = new Date(period.end);
      if (blockStart > blockEnd) {
        const tmp = blockStart;
        blockStart = blockEnd;
        blockEnd = tmp;
      }
      blockStart.setHours(0, 0, 0, 0);
      blockEnd.setHours(0, 0, 0, 0);
      return d >= blockStart && d <= blockEnd;
    });
  };

  // Désactive les dates de retour invalides: passées, bloquées, ou <= date de départ
  const isEndDateDisabled = (date: Date): boolean => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    if (date < today) return true;
    if (isDateBlocked(date)) return true;
    if (dateRange?.from) {
      const startDay = new Date(dateRange.from);
      startDay.setHours(0, 0, 0, 0);
      if (date <= startDay) return true;
    }
    return false;
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
      vehicle.pricePerDay
    );
    return { numberOfDays: result.totalDays, totalPrice: result.totalPrice };
  }, [dateRange, startTime, endTime, vehicle.pricePerDay]);

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

  return (
    <div className="rounded-xl border border-gray-300 bg-white p-6 lg:sticky lg:top-28">
      <h2 className="text-2xl font-bold mb-6">Votre réservation</h2>

      {/* Dates Section */}
      <div className="space-y-4 mb-6">
        <DateTimePicker
          label="Départ"
          dateRange={dateRange}
          onDateRangeChange={handleStartDateChange}
          selectedTime={startTime}
          onTimeChange={setStartTime}
          timeSlots={timeSlots}
          dateValue={dateRange?.from}
          openCalendar={openStartCalendar}
          onOpenCalendarChange={setOpenStartCalendar}
          disabledDates={isDateBlocked}
          showBorder
          calendarMode="single"
        />
        <DateTimePicker
          label="Retour"
          dateRange={dateRange}
          onDateRangeChange={handleEndDateChange}
          selectedTime={endTime}
          onTimeChange={setEndTime}
          timeSlots={timeSlots}
          dateValue={dateRange?.to}
          openCalendar={openEndCalendar}
          onOpenCalendarChange={setOpenEndCalendar}
          disabledDates={isEndDateDisabled}
          showBorder
          calendarMode="range"
        />
      </div>

      {/* Vehicle Summary */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Récapitulatif</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Véhicule</span>
            <span className="font-medium">
              {vehicle.brand} {vehicle.model}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tarif / jour</span>
            <span className="font-medium">{vehicle.pricePerDay} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Nombre de jours</span>
            <span className="font-medium">
              {numberOfDays} jour{numberOfDays > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold">Total</h4>
          <span className="text-2xl font-bold text-black">
            {totalPrice.toLocaleString("fr-FR")} €
          </span>
        </div>
      </div>

      {/* CTA Button avec spinner pendant l'étape 2 */}
      <Button
        className="w-full mt-6"
        disabled={currentStep === 2}
        type="button"
        onClick={onProceedToForm}
      >
        {currentStep === 2 ? (
          <LoadingSpinner variant="green" size="sm" />
        ) : (
          "Valider"
        )}
      </Button>
    </div>
  );
};
