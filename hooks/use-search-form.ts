import { useMemo, useState, useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { isAfter, parse } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Vehicle, Agency } from "@/types";
import { isVehicleAvailable, generateTimeSlots } from "@/lib/utils";

interface SearchFormData {
  agencyId: string;
  dateRange?: DateRange;
  startTime?: string;
  endTime?: string;
}

export const useSearchForm = (agencies: Agency[]) => {
  // Auto-select agency if there's only one
  const defaultAgencyId = agencies.length === 1 ? agencies[0].id : "";

  const { handleSubmit, control, setValue, formState: { isSubmitting } } = useForm<SearchFormData>({
    defaultValues: {
      agencyId: defaultAgencyId,
      dateRange: undefined,
      startTime: undefined,
      endTime: undefined,
    },
  });

  const agencyId = useWatch({ control, name: "agencyId" });
  const dateRange = useWatch({ control, name: "dateRange" });
  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });

  const [openStartCalendar, setOpenStartCalendar] = useState(false);
  const [openEndCalendar, setOpenEndCalendar] = useState(false);

  const startTimeRef = useRef<HTMLButtonElement>(null);
  const endTimeRef = useRef<HTMLButtonElement>(null);
  const previousStartDateRef = useRef<Date | undefined>(undefined);
  const previousEndDateRef = useRef<Date | undefined>(undefined);

  // Custom handler to prevent auto-setting end date equal to start date
  const handleDateRangeChange = (range: DateRange | undefined) => {
    // If both from and to are the same, only set from
    if (
      range?.from &&
      range?.to &&
      range.from.getTime() === range.to.getTime()
    ) {
      setValue("dateRange", { from: range.from, to: undefined });
    } else {
      setValue("dateRange", range);
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

  // Filter available start time slots based on current date/time
  const availableStartTimeSlots = useMemo(() => {
    if (!dateRange?.from) return timeSlots;

    const selectedDate = new Date(dateRange.from);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If selected date is not today, all time slots are available
    if (selectedDate.getTime() !== today.getTime()) {
      return timeSlots;
    }

    // If selected date is today, filter out past time slots
    const now = new Date();

    return timeSlots.filter((timeSlot) => {
      const slotTime = parse(timeSlot, "HH:mm", new Date());
      slotTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

      return isAfter(slotTime, now) || slotTime.getTime() === now.getTime();
    });
  }, [dateRange, timeSlots]);

  // Check if today should be disabled (no available time slots)
  const isTodayDisabled = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // Check if any time slot is available today
    const hasAvailableSlots = timeSlots.some((timeSlot) => {
      const [hours, minutes] = timeSlot.split(":").map(Number);
      return hours > currentHours || (hours === currentHours && minutes > currentMinutes);
    });

    return !hasAvailableSlots;
  }, [timeSlots]);

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

  // Auto-submit: submitted is true when all required data is present
  const submitted = useMemo(() => {
    return !!(agencyId && dateRange?.from && dateRange?.to && startTime && endTime);
  }, [agencyId, dateRange?.from, dateRange?.to, startTime, endTime]);

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

    // If submitted but no times selected, show error
    if (!startTime || !endTime) {
      return {
        filtered: [] as Vehicle[],
        error: "Veuillez sélectionner les heures de location.",
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

  return {
    agencyId,
    dateRange,
    startTime,
    endTime,
    submitted,
    openStartCalendar,
    openEndCalendar,
    isSubmitting,
    timeSlots,
    availableStartTimeSlots,
    isTodayDisabled,
    filtered,
    error,
    startTimeRef,
    endTimeRef,
    setAgencyId: (value: string) => setValue("agencyId", value),
    setStartTime: (value: string | undefined) => setValue("startTime", value),
    setEndTime: (value: string | undefined) => setValue("endTime", value),
    setOpenStartCalendar,
    setOpenEndCalendar,
    handleDateRangeChange,
    handleSubmit,
  };
};
