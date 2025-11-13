import { useMemo, useState, useRef, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import type { Vehicle } from "@/types";
import {
  isVehicleAvailable,
  getAllAgencies,
  generateTimeSlots,
} from "@/lib/utils";
import { organizations } from "@/data/vehicles";

export const useSearchForm = () => {
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

  const startTimeRef = useRef<HTMLButtonElement>(null);
  const endTimeRef = useRef<HTMLButtonElement>(null);
  const previousStartDateRef = useRef<Date | undefined>(undefined);
  const previousEndDateRef = useRef<Date | undefined>(undefined);
  const previousEndTimeRef = useRef<string>("");

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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setIsLoading(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return {
    agencies,
    agencyId,
    dateRange,
    startTime,
    endTime,
    submitted,
    openStartCalendar,
    openEndCalendar,
    isLoading,
    timeSlots,
    filtered,
    error,
    startTimeRef,
    endTimeRef,
    setAgencyId,
    setStartTime,
    setEndTime,
    setOpenStartCalendar,
    setOpenEndCalendar,
    handleDateRangeChange,
    onSubmit,
  };
};
