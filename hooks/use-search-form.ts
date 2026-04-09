import { useMemo, useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { DateRange } from "react-day-picker";
import type { Vehicle, Agency } from "@/types";
import {
  generateTimeSlots,
  getAvailableEndTimeSlots,
  getAvailableStartTimeSlots,
  isTodayDisabledForBooking
} from "@/lib/utils";
import { isVehicleAvailable, type BookingAvailabilityView } from "@/domain/vehicle";

interface SearchFormData {
  agencyId: string;
  dateRange?: DateRange;
  startTime?: string;
  endTime?: string;
}

interface UseSearchFormProps {
  agencies: Agency[];
  bookingsMap?: Map<string, BookingAvailabilityView[]>;
}

export const useSearchForm = ({ agencies, bookingsMap = new Map() }: UseSearchFormProps) => {
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

  // Handler pour la date de départ
  const handleStartDateChange = (range: DateRange | undefined) => {
    if (!range?.from) return;

    // Met à jour uniquement la date de départ
    setValue("dateRange", { from: range.from, to: dateRange?.to });

    // Ferme le calendrier et ouvre le sélecteur d'heure
    setOpenStartCalendar(false);
    setTimeout(() => startTimeRef.current?.click(), 100);
  };

  // Handler pour la date de retour
  const handleEndDateChange = (range: DateRange | undefined) => {
    if (!range) return;

    // En mode range, on peut avoir soit from, soit from + to
    const newTo = range.to || range.from;
    if (!newTo) return;

    // Met à jour la date de retour
    setValue("dateRange", { from: dateRange?.from, to: newTo });

    // Ferme le calendrier et ouvre le sélecteur d'heure si la plage est complète
    if (range.to) {
      setOpenEndCalendar(false);
      setTimeout(() => endTimeRef.current?.click(), 100);
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
    return getAvailableStartTimeSlots(dateRange?.from, timeSlots);
  }, [dateRange?.from, timeSlots]);

  // Check if today should be disabled (no available time slots)
  const isTodayDisabled = useMemo(() => {
    return isTodayDisabledForBooking(timeSlots);
  }, [timeSlots]);

  // Filtre les heures de retour pour same-day booking
  const availableEndTimeSlots = useMemo(() => {
    return getAvailableEndTimeSlots(dateRange?.from, dateRange?.to, startTime, timeSlots);
  }, [dateRange?.from, dateRange?.to, startTime, timeSlots]);

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

    // Valider la plage de dates/heures (permet same-day si heures correctes)
    if (endDateTime <= startDateTime) {
      return {
        filtered: [] as Vehicle[],
        error: "L'heure de retour doit être après l'heure de départ.",
      };
    }

    const agency = agencies.find((a) => a.id === agencyId);
    if (!agency) {
      return { filtered: [] as Vehicle[], error: "Agence introuvable." };
    }

    const available = agency.vehicles.filter((vehicle) => {
      const bookings = bookingsMap.get(vehicle.id) || [];
      return isVehicleAvailable(vehicle, startDateTime, endDateTime, bookings);
    });
    return { filtered: available, error: "" };
  }, [
    agencies,
    submitted,
    agencyId,
    dateRange,
    startTime,
    endTime,
    allVehicles,
    bookingsMap,
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
    availableEndTimeSlots,
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
    handleStartDateChange,
    handleEndDateChange,
    handleSubmit,
  };
};
