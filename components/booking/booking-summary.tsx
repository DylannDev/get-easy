"use client";

import type { Vehicle } from "@/types";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/search-form/date-time-picker";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useBookingSummary } from "@/hooks/use-booking-summary";
import { getPricePerDay } from "@/lib/utils";

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
  const {
    dateRange,
    startTime,
    endTime,
    timeSlots,
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
  } = useBookingSummary({ vehicle, startDate, endDate });

  // Calcul du tarif applicable en fonction du nombre de jours
  const applicablePricePerDay =
    vehicle.pricingTiers && numberOfDays > 0
      ? getPricePerDay(numberOfDays, vehicle.pricingTiers)
      : vehicle.pricePerDay;

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
            <span className="font-medium">{applicablePricePerDay} €</span>
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
