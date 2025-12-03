"use client";

import { Search } from "lucide-react";
import { AgencySelect } from "@/components/search-form/agency-select";
import { DateTimePicker } from "@/components/search-form/date-time-picker";
import { VehicleResults } from "@/components/search-form/vehicle-results";
import { useSearchForm } from "@/hooks/use-search-form";
import Image from "next/image";
import type { Agency } from "@/types";
import type { VehicleBooking } from "@/actions/get-vehicle-bookings";

interface SearchFormProps {
  agencies: Agency[];
  bookingsMap: Map<string, VehicleBooking[]>;
}

export const SearchForm = ({ agencies, bookingsMap }: SearchFormProps) => {
  const {
    agencyId,
    dateRange,
    startTime,
    endTime,
    submitted,
    openStartCalendar,
    openEndCalendar,
    isSubmitting,
    availableStartTimeSlots,
    availableEndTimeSlots,
    isTodayDisabled,
    filtered,
    error,
    startTimeRef,
    endTimeRef,
    setAgencyId,
    setStartTime,
    setEndTime,
    setOpenStartCalendar,
    setOpenEndCalendar,
    handleStartDateChange,
    handleEndDateChange,
    handleSubmit,
  } = useSearchForm({ agencies, bookingsMap });

  // Function to disable dates in the start date picker
  const isStartDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Disable if date is today and no time slots available
    if (checkDate.getTime() === today.getTime() && isTodayDisabled) {
      return true;
    }

    return false;
  };

  return (
    <section className="w-full">
      <div className="relative h-56 mx-auto overflow-hidden rounded-2xl sm:h-72 md:h-80">
        <Image
          width={1267}
          height={713}
          src="/banner.jpg"
          alt="Location de voitures en Guyane à Rémire-Montjoly - Get Easy"
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/30 to-black/70" />
        <div className="absolute inset-x-0 top-[50%] -translate-y-1/2 max-w-[80%] mx-auto">
          <div className="mb-4 text-white text-center">
            <h1 className="text-3xl sm:text-4xl">
              Location de voitures récentes en Guyane
            </h1>
            <h2 className="text-xl font-sans">
              Livraison gratuite à Cayenne, Rémire-Montjoly, Matoury et à
              l’aéroport Félix Éboué.
            </h2>
          </div>

          <form
            onSubmit={handleSubmit(async () => {})}
            className=" rounded-xl bg-white p-3"
          >
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
      </div>

      {/* Results */}
      <div className="mt-5">
        {error ? (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 w-fit">
            {error}
          </div>
        ) : (
          <VehicleResults
            vehicles={filtered}
            isSubmitted={submitted}
            isSubmitting={isSubmitting}
            dateRange={dateRange}
            startTime={startTime}
            endTime={endTime}
          />
        )}
      </div>
    </section>
  );
};
