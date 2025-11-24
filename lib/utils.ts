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

  // Normalise les dates de la requête à la journée (comme dans booking-summary)
  const normalizedRequestStart = new Date(requestedStart);
  const normalizedRequestEnd = new Date(requestedEnd);
  normalizedRequestStart.setHours(0, 0, 0, 0);
  normalizedRequestEnd.setHours(0, 0, 0, 0);

  // Vérifie si la période demandée chevauche une période bloquée
  // Un chevauchement existe si : requestStart <= blockEnd && requestEnd >= blockStart
  const hasOverlap = vehicle.blockedPeriods.some((blocked) => {
    let blockedStart = new Date(blocked.start);
    let blockedEnd = new Date(blocked.end);

    // Corrige les périodes inversées
    if (blockedStart > blockedEnd) {
      const tmp = blockedStart;
      blockedStart = blockedEnd;
      blockedEnd = tmp;
    }

    // Normalise les dates bloquées à la journée
    blockedStart.setHours(0, 0, 0, 0);
    blockedEnd.setHours(0, 0, 0, 0);

    // Logique cohérente avec booking-summary
    return (
      normalizedRequestStart <= blockedEnd &&
      normalizedRequestEnd >= blockedStart
    );
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

    // Check if start date is not in the past (normalize to day level)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);

    if (normalizedStartDate < now) {
      return { isValid: false };
    }

    return { isValid: true, startDate, endDate };
  } catch {
    return { isValid: false };
  }
}

/**
 * Détermine le prix par jour en fonction de la durée de location et des paliers tarifaires
 *
 * @param days - Nombre de jours de location
 * @param tiers - Tableau des paliers tarifaires triés par minDays croissant
 * @returns Le prix par jour applicable
 */
export function getPricePerDay(
  days: number,
  tiers: { minDays: number; pricePerDay: number }[]
): number {
  if (!tiers || tiers.length === 0) {
    throw new Error("Les paliers tarifaires sont requis");
  }

  // Trouve le palier avec le minDays le plus élevé <= nombre de jours
  let applicableTier = tiers[0];

  for (const tier of tiers) {
    if (tier.minDays <= days) {
      applicableTier = tier;
    } else {
      break;
    }
  }

  return applicableTier.pricePerDay;
}

/**
 * Calcule le prix total d'une location en fonction des dates de début et de fin
 * Tout jour entamé est dû (arrondi au jour supérieur)
 *
 * @param startDate - Date de début de location
 * @param endDate - Date de fin de location
 * @param pricePerDay - Prix par jour du véhicule (deprecated, utiliser pricingTiers)
 * @param pricingTiers - Paliers tarifaires optionnels pour tarification dégressive
 * @returns Objet contenant le nombre de jours et le prix total
 */
export function calculateTotalPrice(
  startDate: Date,
  endDate: Date,
  pricePerDay: number,
  pricingTiers?: { minDays: number; pricePerDay: number }[]
): { totalDays: number; totalPrice: number } {
  // Calcul du nombre de jours (différence en millisecondes / millisecondes par jour)
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / msPerDay
  );

  // Utilise les paliers tarifaires si disponibles, sinon le prix fixe
  const applicablePricePerDay = pricingTiers
    ? getPricePerDay(totalDays, pricingTiers)
    : pricePerDay;

  const totalPrice = totalDays * applicablePricePerDay;

  return { totalDays, totalPrice };
}
