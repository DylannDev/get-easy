import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Vehicle, Agency, Organization, AgencyHours } from "@/types";
import { organizations } from "@/data/vehicles";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTimeSlots(hours: AgencyHours): string[] {
  const slots: string[] = [];
  const [openHour, openMinute] = hours.openTime.split(":").map(Number);
  const [closeHour, closeMinute] = hours.closeTime.split(":").map(Number);

  const startMinutes = openHour * 60 + openMinute;
  const endMinutes = closeHour * 60 + closeMinute;

  for (
    let minutes = startMinutes;
    minutes <= endMinutes;
    minutes += hours.interval
  ) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeString = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    slots.push(timeString);
  }

  return slots;
}

export function isVehicleAvailable(
  vehicle: Vehicle,
  requestedStart: Date,
  requestedEnd: Date
): boolean {
  if (requestedEnd <= requestedStart) return false;

  // Vérifie si la période demandée chevauche une période bloquée
  // Overlap condition: A_start < B_end && A_end > B_start
  const hasOverlap = vehicle.blockedPeriods.some((blocked) => {
    const blockedStart = new Date(blocked.start);
    const blockedEnd = new Date(blocked.end);
    return requestedStart < blockedEnd && requestedEnd > blockedStart;
  });

  // Le véhicule est disponible s'il n'y a AUCUN chevauchement
  return !hasOverlap;
}

export function getAllAgencies(organizations: Organization[]): Agency[] {
  return organizations.flatMap((org) => org.agencies);
}

export function getAgencyById(
  organizations: Organization[],
  agencyId: string
): Agency | undefined {
  return getAllAgencies(organizations).find((agency) => agency.id === agencyId);
}

// Helper function to find vehicle by ID
export function findVehicleById(vehicleId: string): Vehicle | null {
  for (const org of organizations) {
    for (const agency of org.agencies) {
      const vehicle = agency.vehicles.find((v) => v.id === vehicleId);
      if (vehicle) return vehicle;
    }
  }
  return null;
}

// Validate dates
export function validateDates(
  start?: string,
  end?: string
): {
  isValid: boolean;
  startDate?: Date;
  endDate?: Date;
} {
  if (!start || !end) {
    return { isValid: false };
  }

  try {
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { isValid: false };
    }

    // Check if end date is after start date
    if (endDate <= startDate) {
      return { isValid: false };
    }

    // Check if dates are not in the past
    const now = new Date();
    if (startDate < now) {
      return { isValid: false };
    }

    return { isValid: true, startDate, endDate };
  } catch {
    return { isValid: false };
  }
}

/**
 * Calcule le prix total d'une location en fonction des dates de début et de fin
 * Tout jour entamé est dû (arrondi au jour supérieur)
 *
 * @param startDate - Date de début de location
 * @param endDate - Date de fin de location
 * @param pricePerDay - Prix par jour du véhicule
 * @returns Objet contenant le nombre de jours et le prix total
 */
export function calculateTotalPrice(
  startDate: Date,
  endDate: Date,
  pricePerDay: number
): { totalDays: number; totalPrice: number } {
  // Calcul du nombre de jours (différence en millisecondes / millisecondes par jour)
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / msPerDay
  );
  const totalPrice = totalDays * pricePerDay;

  return { totalDays, totalPrice };
}
