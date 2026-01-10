/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect } from "react";
import { SearchFormDesktop } from "@/components/search-form/search-form-desktop";
import { SearchFormMobile } from "@/components/search-form/search-form-mobile";
import { VehicleResults } from "@/components/search-form/vehicle-results";
import { useSearchForm } from "@/hooks/use-search-form";
import Image from "next/image";
import type { Agency } from "@/types";
import type { VehicleBooking } from "@/actions/get-vehicle-bookings";
import { toast } from "sonner";

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

  // Wrapper function for form submission
  const onSubmit = handleSubmit(async () => {});

  // Afficher un toast en cas d'erreur
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <section className="w-full mb-6">
      <div className="relative mx-auto overflow-hidden sm:rounded-2xl h-64 sm:h-72 md:h-80">
        <Image
          width={1267}
          height={713}
          src="/banner.jpg"
          alt="Location de voitures en Guyane à Rémire-Montjoly - Get Easy"
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/30 to-black/70" />

        {/* Version Desktop (>= 1130px) */}
        <div className="hidden min-[1130px]:block">
          <SearchFormDesktop
            agencies={agencies}
            agencyId={agencyId}
            setAgencyId={setAgencyId}
            dateRange={dateRange}
            handleStartDateChange={handleStartDateChange}
            handleEndDateChange={handleEndDateChange}
            startTime={startTime}
            endTime={endTime}
            setStartTime={setStartTime}
            setEndTime={setEndTime}
            availableStartTimeSlots={availableStartTimeSlots}
            availableEndTimeSlots={availableEndTimeSlots}
            openStartCalendar={openStartCalendar}
            openEndCalendar={openEndCalendar}
            setOpenStartCalendar={setOpenStartCalendar}
            setOpenEndCalendar={setOpenEndCalendar}
            startTimeRef={startTimeRef}
            endTimeRef={endTimeRef}
            isStartDateDisabled={isStartDateDisabled}
            handleSubmit={onSubmit}
          />
        </div>

        {/* Version Mobile - Titres et bouton trigger (< 1130px) */}
        <div className="absolute top-[50%] -translate-y-1/2 left-[50%] -translate-x-1/2 w-full max-w-[90%] px-2 sm:px-4 min-[1130px]:hidden">
          <div className="mb-4 text-white text-center">
            <h1 className="text-2xl sm:text-3xl">
              Location de voitures récentes en Guyane
            </h1>
            <h2 className="text-base sm:text-lg font-sans mt-2">
              Livraison gratuite à Cayenne, Rémire-Montjoly, Matoury et à
              l'Aéroport.
            </h2>
          </div>

          <SearchFormMobile
            agencies={agencies}
            agencyId={agencyId}
            setAgencyId={setAgencyId}
            dateRange={dateRange}
            handleStartDateChange={handleStartDateChange}
            handleEndDateChange={handleEndDateChange}
            startTime={startTime}
            endTime={endTime}
            setStartTime={setStartTime}
            setEndTime={setEndTime}
            availableStartTimeSlots={availableStartTimeSlots}
            availableEndTimeSlots={availableEndTimeSlots}
            isStartDateDisabled={isStartDateDisabled}
            handleSubmit={onSubmit}
          />
        </div>
      </div>

      {/* Results */}
      <div className="py-5 px-4 sm:px-0">
        <VehicleResults
          vehicles={filtered}
          isSubmitted={submitted}
          isSubmitting={isSubmitting}
          dateRange={dateRange}
          startTime={startTime}
          endTime={endTime}
        />
      </div>
    </section>
  );
};
