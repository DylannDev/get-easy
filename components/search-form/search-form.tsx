"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { Vehicle } from "@/types";
import {
  isVehicleAvailable,
  getAllAgencies,
  generateTimeSlots,
} from "@/lib/utils";
import { AgencySelect } from "@/components/search-form/agency-select";
import { DateTimePicker } from "@/components/search-form/date-time-picker";
import { VehicleResults } from "@/components/search-form/vehicle-results";
import { organizations } from "@/data/vehicles";
import Image from "next/image";

export const SearchForm = () => {
  const agencies = getAllAgencies(organizations);

  // Auto-select agency if there's only one
  const defaultAgencyId = agencies.length === 1 ? agencies[0].id : "";

  const [agencyId, setAgencyId] = useState(defaultAgencyId);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:00");
  const [submitted, setSubmitted] = useState(false);
  const [openStartCalendar, setOpenStartCalendar] = useState(false);
  const [openEndCalendar, setOpenEndCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Custom handler to prevent auto-setting end date equal to start date
  const handleDateRangeChange = (range: DateRange | undefined) => {
    // If both from and to are the same, only set from
    if (
      range?.from &&
      range?.to &&
      range.from.getTime() === range.to.getTime()
    ) {
      setDateRange({ from: range.from, to: undefined });
    } else {
      setDateRange(range);
    }
  };

  const startTimeRef = useRef<HTMLButtonElement>(null);
  const endTimeRef = useRef<HTMLButtonElement>(null);
  const previousStartDateRef = useRef<Date | undefined>(undefined);
  const previousEndDateRef = useRef<Date | undefined>(undefined);
  const previousEndTimeRef = useRef<string>("");

  // Get selected agency
  const selectedAgency = useMemo(() => {
    return agencies.find((a) => a.id === agencyId);
  }, [agencyId, agencies]);

  // Get time slots based on selected agency
  const timeSlots = useMemo(() => {
    if (!selectedAgency) {
      // Default time slots if no agency selected
      return [
        "08:00",
        "08:30",
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "12:00",
        "12:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
        "17:30",
        "18:00",
        "18:30",
        "19:00",
      ];
    }
    return generateTimeSlots(selectedAgency.hours);
  }, [selectedAgency]);

  // Auto-focus on time select when dates are selected
  useEffect(() => {
    const currentStartDate = dateRange?.from;
    const currentEndDate = dateRange?.to;
    const previousStartDate = previousStartDateRef.current;
    const previousEndDate = previousEndDateRef.current;

    // Check if dates changed
    const startDateChanged =
      currentStartDate?.getTime() !== previousStartDate?.getTime();
    const endDateChanged =
      currentEndDate?.getTime() !== previousEndDate?.getTime();

    // Handle start date change
    if (startDateChanged && currentStartDate && openStartCalendar) {
      setTimeout(() => {
        setOpenStartCalendar(false);
        setTimeout(() => startTimeRef.current?.click(), 100);
      }, 0);
    }

    // Handle end date change
    if (endDateChanged && currentEndDate && openEndCalendar) {
      setTimeout(() => {
        setOpenEndCalendar(false);
        setTimeout(() => endTimeRef.current?.click(), 100);
      }, 0);
    }

    // Update refs
    previousStartDateRef.current = currentStartDate;
    previousEndDateRef.current = currentEndDate;
  }, [dateRange?.from, dateRange?.to, openStartCalendar, openEndCalendar]);

  // Auto-submit when end time is selected
  useEffect(() => {
    // Only trigger if endTime has actually changed and is not the initial value
    if (
      previousEndTimeRef.current !== "" &&
      endTime !== previousEndTimeRef.current &&
      agencyId &&
      dateRange?.from &&
      dateRange?.to
    ) {
      // Simulate loading with async function
      const submitSearch = async () => {
        setSubmitted(true);
        setIsLoading(true);
        // Simulate API call delay
        // await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);
      };

      submitSearch();
    }

    // Update the ref after checking
    previousEndTimeRef.current = endTime;
  }, [endTime, agencyId, dateRange]);

  // Get all vehicles from all agencies
  const allVehicles = useMemo(() => {
    return agencies.flatMap((agency) => agency.vehicles);
  }, [agencies]);

  const { filtered, error } = useMemo(() => {
    // If not submitted, show all vehicles
    if (!submitted) {
      return { filtered: allVehicles, error: "" };
    }

    // If submitted but no agency selected, show error
    if (!agencyId) {
      return {
        filtered: [] as Vehicle[],
        error: "Veuillez choisir une agence.",
      };
    }

    // If submitted but no dates selected, show error
    if (!dateRange?.from || !dateRange?.to) {
      return {
        filtered: [] as Vehicle[],
        error: "Veuillez sélectionner vos dates de location.",
      };
    }

    // Combine date and time
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startDateTime = new Date(dateRange.from);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(dateRange.to);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    if (endDateTime <= startDateTime) {
      return {
        filtered: [] as Vehicle[],
        error: "La date de retour doit être après la date de départ.",
      };
    }

    const agency = agencies.find((a) => a.id === agencyId);
    if (!agency) {
      return { filtered: [] as Vehicle[], error: "Agence introuvable." };
    }

    const available = agency.vehicles.filter((v) =>
      isVehicleAvailable(v, startDateTime, endDateTime)
    );
    return { filtered: available, error: "" };
  }, [
    agencies,
    submitted,
    agencyId,
    dateRange,
    startTime,
    endTime,
    allVehicles,
  ]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setIsLoading(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  }

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

          <form onSubmit={onSubmit} className=" rounded-xl bg-white p-3">
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
                  onDateRangeChange={handleDateRangeChange}
                  selectedTime={startTime}
                  onTimeChange={setStartTime}
                  timeSlots={timeSlots}
                  dateValue={dateRange?.from}
                  openCalendar={openStartCalendar}
                  onOpenCalendarChange={setOpenStartCalendar}
                  timeRef={startTimeRef}
                />

                {/* End Date & Time */}
                <DateTimePicker
                  label="Date de retour"
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  selectedTime={endTime}
                  onTimeChange={setEndTime}
                  timeSlots={timeSlots}
                  dateValue={dateRange?.to}
                  openCalendar={openEndCalendar}
                  onOpenCalendarChange={setOpenEndCalendar}
                  timeRef={endTimeRef}
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
            isLoading={isLoading}
            dateRange={dateRange}
            startTime={startTime}
            endTime={endTime}
          />
        )}
      </div>
    </section>
  );
};
