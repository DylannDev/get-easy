"use client";

import { useState } from "react";
import type { Vehicle } from "@/types";
import type { Option } from "@/domain/option";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/date-time-picker/date-time-picker";
import { DateTimePickerMobile } from "@/components/date-time-picker/date-time-picker-mobile";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getApplicablePricePerDay } from "@/domain/vehicle";
import { computeOptionLineTotal } from "@/domain/option";
import { formatMoney } from "@/lib/format-money";

interface BookingSummaryProps {
  vehicle: Vehicle;
  currentStep?: number;
  onProceedToForm?: () => void;
  bookingSummaryData: ReturnType<
    typeof import("@/hooks/use-booking-summary").useBookingSummary
  >;
  options?: Option[];
  selectedOptions?: Record<string, number>;
  optionsTotal?: number;
}

export const BookingSummary = ({
  vehicle,
  currentStep = 1,
  onProceedToForm,
  bookingSummaryData,
  options = [],
  selectedOptions = {},
  optionsTotal = 0,
}: BookingSummaryProps) => {
  // États pour gérer l'affichage du calendrier mobile
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  // Utiliser les données du hook partagé au niveau du parent
  const {
    dateRange,
    startTime,
    endTime,
    availableStartTimeSlots,
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
  } = bookingSummaryData;

  // Validation des dates : les deux dates doivent être définies
  const areDatesValid = dateRange?.from && dateRange?.to;

  // Calcul du tarif applicable en fonction du nombre de jours
  const applicablePricePerDay =
    vehicle.pricingTiers && vehicle.pricingTiers.length > 0 && numberOfDays > 0
      ? getApplicablePricePerDay(numberOfDays, vehicle.pricingTiers, vehicle.pricePerDay)
      : (vehicle.pricePerDay ?? 0);

  // Calcul des économies réalisées
  const savings =
    vehicle.pricingTiers && applicablePricePerDay < vehicle.pricePerDay
      ? (vehicle.pricePerDay - applicablePricePerDay) * numberOfDays
      : 0;

  return (
    <div className="rounded-xl border border-gray-300 bg-white p-6 lg:sticky lg:top-28">
      <h2 className="text-2xl font-bold mb-6">Votre réservation</h2>

      {/* Dates Section */}
      <div className="space-y-4 mb-6">
        {/* Version Mobile - visible uniquement < lg (< 1024px) */}
        <div className="lg:hidden space-y-4">
          <DateTimePickerMobile
            label="Date de départ"
            dateRange={dateRange}
            onDateRangeChange={handleStartDateChange}
            selectedTime={startTime}
            onTimeChange={setStartTime}
            timeSlots={availableStartTimeSlots}
            dateValue={dateRange?.from}
            disabledDates={isDateBlocked}
            calendarMode="single"
            showCalendar={showStartCalendar}
            setShowCalendar={setShowStartCalendar}
            showBorder
          />
          <DateTimePickerMobile
            label="Date de retour"
            dateRange={dateRange}
            onDateRangeChange={handleEndDateChange}
            selectedTime={endTime}
            onTimeChange={setEndTime}
            timeSlots={availableEndTimeSlots}
            dateValue={dateRange?.to}
            disabledDates={isEndDateDisabled}
            calendarMode="range"
            showCalendar={showEndCalendar}
            setShowCalendar={setShowEndCalendar}
            showBorder
          />
        </div>

        {/* Version Desktop - visible uniquement >= lg (>= 1024px) */}
        <div className="hidden lg:block space-y-4">
          <DateTimePicker
            label="Départ"
            dateRange={dateRange}
            onDateRangeChange={handleStartDateChange}
            selectedTime={startTime}
            onTimeChange={setStartTime}
            timeSlots={availableStartTimeSlots}
            dateValue={dateRange?.from}
            openCalendar={openStartCalendar}
            onOpenCalendarChange={setOpenStartCalendar}
            disabledDates={isDateBlocked}
            showBorder
            calendarMode="single"
            timePickerClassName="min-w-[90px]"
          />
          <DateTimePicker
            label="Retour"
            dateRange={dateRange}
            onDateRangeChange={handleEndDateChange}
            selectedTime={endTime}
            onTimeChange={setEndTime}
            timeSlots={availableEndTimeSlots}
            dateValue={dateRange?.to}
            openCalendar={openEndCalendar}
            onOpenCalendarChange={setOpenEndCalendar}
            disabledDates={isEndDateDisabled}
            showBorder
            calendarMode="range"
            timePickerClassName="min-w-[90px]"
          />
        </div>
      </div>

      {/* Vehicle Summary */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Récapitulatif</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Véhicule</span>
            <span className="font-semibold">
              {vehicle.brand} {vehicle.model}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tarif / jour</span>
            <span className="font-semibold">
              {savings > 0 && (
                <span className="line-through text-gray-400 text-[13px] mr-1">
                  {formatMoney(vehicle.pricePerDay)}
                </span>
              )}
              {formatMoney(applicablePricePerDay)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Durée location</span>
            <span className="font-semibold">
              {numberOfDays} jour{numberOfDays > 1 ? "s" : ""}
            </span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total avant remise</span>
              <span className="font-semibold line-through text-gray-400 mr-1">
                {formatMoney(vehicle.pricePerDay * numberOfDays)}
              </span>
            </div>
          )}
          {savings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Remise {numberOfDays} jour{numberOfDays > 1 ? "s" : ""}
              </span>
              <span className="font-semibold text-black bg-green px-2 py-0.5 rounded-sm">
                -{formatMoney(savings)}
              </span>
            </div>
          )}

          {/* Lignes options sélectionnées */}
          {options.map((option) => {
            const qty = selectedOptions[option.id] ?? 0;
            if (qty <= 0) return null;
            const line = computeOptionLineTotal(
              {
                unitPrice: option.price,
                priceType: option.priceType,
                quantity: qty,
                monthlyCap: option.capEnabled ? option.monthlyCap : null,
              },
              numberOfDays
            );
            return (
              <div key={option.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {option.name}
                  {qty > 1 ? ` ×${qty}` : ""}
                </span>
                <span className="font-semibold">{formatMoney(line)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold">Total</h4>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-black">
              {formatMoney(totalPrice + optionsTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* CTA Button avec spinner pendant l'étape 2 */}
      <Button
        className="w-full mt-6"
        disabled={currentStep === 2 || !areDatesValid}
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
