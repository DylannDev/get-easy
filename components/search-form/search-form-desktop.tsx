"use client";

import { Search } from "lucide-react";
import { AgencySelect } from "@/components/search-form/agency-select";
import { DateTimePicker } from "@/components/date-time-picker/date-time-picker";
import type { Agency } from "@/types";
import type { DateRange } from "react-day-picker";

interface SearchFormDesktopProps {
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
  openStartCalendar: boolean;
  openEndCalendar: boolean;
  setOpenStartCalendar: (open: boolean) => void;
  setOpenEndCalendar: (open: boolean) => void;
  startTimeRef: React.RefObject<HTMLButtonElement | null>;
  endTimeRef: React.RefObject<HTMLButtonElement | null>;
  isStartDateDisabled: (date: Date) => boolean;
  handleSubmit: (e?: React.BaseSyntheticEvent) => void;
}

export const SearchFormDesktop = ({
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
  openStartCalendar,
  openEndCalendar,
  setOpenStartCalendar,
  setOpenEndCalendar,
  startTimeRef,
  endTimeRef,
  isStartDateDisabled,
  handleSubmit,
}: SearchFormDesktopProps) => {
  return (
    <div className="absolute top-[50%] -translate-y-1/2 left-[50%] -translate-x-1/2 flex flex-col w-full max-w-[80%]">
      <div className="mb-4 text-white text-center">
        <h1 className="text-3xl sm:text-4xl">
          Location de voitures récentes en Guyane
        </h1>
        <h2 className="text-xl font-sans">
          Livraison gratuite à Cayenne, Rémire-Montjoly, Matoury et à
          l&apos;aéroport Félix Éboué.
        </h2>
      </div>

      <form onSubmit={handleSubmit} className=" rounded-xl bg-white p-3">
        <div className="flex items-end">
          <div className="flex-1 flex items-center gap-3 divide-x divide-gray/30">
            {/* Agency Selection */}
            <AgencySelect
              agencies={agencies}
              value={agencyId}
              onValueChange={setAgencyId}
            />

            {/* Start Date & Time */}
            <DateTimePicker
              label="Date de départ"
              dateRange={dateRange}
              onDateRangeChange={handleStartDateChange}
              selectedTime={startTime}
              onTimeChange={setStartTime}
              timeSlots={availableStartTimeSlots}
              dateValue={dateRange?.from}
              openCalendar={openStartCalendar}
              onOpenCalendarChange={setOpenStartCalendar}
              timeRef={startTimeRef}
              disabledDates={isStartDateDisabled}
              calendarMode="single"
              timePickerClassName="max-w-[100px]"
            />

            {/* End Date & Time */}
            <DateTimePicker
              label="Date de retour"
              dateRange={dateRange}
              onDateRangeChange={handleEndDateChange}
              selectedTime={endTime}
              onTimeChange={setEndTime}
              timeSlots={availableEndTimeSlots}
              dateValue={dateRange?.to}
              openCalendar={openEndCalendar}
              onOpenCalendarChange={setOpenEndCalendar}
              timeRef={endTimeRef}
              calendarMode="range"
              timePickerClassName="max-w-[100px]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="rounded-lg bg-black p-3 h-[46px] w-[46px] flex items-center justify-center cursor-pointer font-medium text-white"
          >
            <Search className="size-5 text-green" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
};
