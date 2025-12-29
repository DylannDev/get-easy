"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";
import { AgencySelect } from "@/components/search-form/agency-select";
import { DateTimePickerMobile } from "@/components/search-form/date-time-picker-mobile";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Agency } from "@/types";
import type { DateRange } from "react-day-picker";

interface SearchFormMobileProps {
  agencies: Agency[];
  agencyId: string;
  setAgencyId: (value: string) => void;
  dateRange: DateRange | undefined;
  handleStartDateChange: (date: DateRange | undefined) => void;
  handleEndDateChange: (date: DateRange | undefined) => void;
  startTime: string | undefined;
  endTime: string | undefined;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  availableStartTimeSlots: string[];
  availableEndTimeSlots: string[];
  isStartDateDisabled: (date: Date) => boolean;
  handleSubmit: (e?: React.BaseSyntheticEvent) => void;
}

export const SearchFormMobile = ({
  agencies,
  agencyId,
  setAgencyId,
  dateRange,
  handleStartDateChange,
  handleEndDateChange,
  startTime,
  endTime,
  setStartTime,
  setEndTime,
  availableStartTimeSlots,
  availableEndTimeSlots,
  isStartDateDisabled,
  handleSubmit,
}: SearchFormMobileProps) => {
  const [open, setOpen] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const handleFormSubmit = (e?: React.BaseSyntheticEvent) => {
    handleSubmit(e);
    setOpen(false);
  };

  const isAnyCalendarOpen = showStartCalendar || showEndCalendar;

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction="top"
      modal={true}
      dismissible={isAnyCalendarOpen ? false : true}
    >
      <DrawerTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between bg-white rounded-lg p-2 shadow-sm max-w-xl mx-auto"
        >
          <input
            placeholder="Sélectionnez vos dates"
            value={
              dateRange?.from && dateRange?.to
                ? `${dateRange.from.toLocaleDateString("fr-FR")} - ${dateRange.to.toLocaleDateString("fr-FR")}`
                : ""
            }
            className="placeholder:text-sm p-1 pointer-events-none text-sm sm:text-base flex-1 "
            readOnly
          />
          <div className="p-2 bg-black rounded-md">
            <Search className="size-5 text-green" strokeWidth={2} />
          </div>
        </button>
      </DrawerTrigger>

      <DrawerContent
        className={cn(
          "rounded-b-xl rounded-t-none p-0 gap-0",
          isAnyCalendarOpen && "min-h-screen"
        )}
      >
        {/* Header avec bouton fermer */}
        <div className="flex flex-row items-center justify-between border-b border-gray-200 p-4">
          <DrawerTitle className="text-lg font-semibold">
            Rechercher un véhicule
          </DrawerTitle>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 bg-black rounded-md"
            aria-label="Fermer"
          >
            <X className="size-5 text-green" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {/* Formulaire */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Agency Selection */}
            <div className="[&>div]:w-full [&>div]:min-w-0 border-b border-gray-300 pb-3">
              <AgencySelect
                agencies={agencies}
                value={agencyId}
                onValueChange={setAgencyId}
              />
            </div>

            {/* Start Date & Time */}
            <div className="border-b border-gray-300">
              <DateTimePickerMobile
                label="Date de départ"
                dateRange={dateRange}
                onDateRangeChange={handleStartDateChange}
                selectedTime={startTime}
                onTimeChange={setStartTime}
                timeSlots={availableStartTimeSlots}
                dateValue={dateRange?.from}
                disabledDates={isStartDateDisabled}
                calendarMode="single"
                showCalendar={showStartCalendar}
                setShowCalendar={setShowStartCalendar}
              />
            </div>

            {/* End Date & Time */}
            <div className="border-b border-gray-300">
              <DateTimePickerMobile
                label="Date de retour"
                dateRange={dateRange}
                onDateRangeChange={handleEndDateChange}
                selectedTime={endTime}
                onTimeChange={setEndTime}
                timeSlots={availableEndTimeSlots}
                dateValue={dateRange?.to}
                calendarMode="range"
                showCalendar={showEndCalendar}
                setShowCalendar={setShowEndCalendar}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="size-5 text-green" strokeWidth={2} />
              Rechercher
            </button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
