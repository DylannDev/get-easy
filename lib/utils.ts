import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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

/**
 * Vérifie si deux dates sont le même jour (ignore l'heure)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d1.getTime() === d2.getTime();
}

/**
 * Formate une date au format français dd/MM/yyyy HH:mm
 */
export function formatDateTimeFR(date: Date): string {
  return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
}

/**
 * Valide et ajuste l'heure de retour pour un same-day booking
 * Retourne le créneau ajusté si nécessaire, ou null si OK
 */
export function validateSameDayBookingTime(
  dateFrom: Date,
  dateTo: Date,
  startTime: string,
  endTime: string,
  timeSlots: string[],
  interval: number = 30
): { isValid: boolean; suggestedTime?: string; minReturnTime?: string } {
  // Si ce n'est pas un same-day booking, pas de validation spécifique
  if (!isSameDay(dateFrom, dateTo)) {
    return { isValid: true };
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // Si l'heure de retour est <= à l'heure de départ
  if (endMinutes <= startMinutes) {
    // Calculer l'heure minimale de retour (départ + intervalle)
    const minReturnMinutes = startMinutes + interval;
    const minReturnHour = Math.floor(minReturnMinutes / 60);
    const minReturnMinute = minReturnMinutes % 60;
    const minReturnTime = `${minReturnHour.toString().padStart(2, "0")}:${minReturnMinute.toString().padStart(2, "0")}`;

    // Trouver le créneau disponible le plus proche
    const suggestedTime = timeSlots.find((slot) => {
      const [slotHour, slotMinute] = slot.split(":").map(Number);
      const slotMinutes = slotHour * 60 + slotMinute;
      return slotMinutes > startMinutes;
    });

    return {
      isValid: false,
      suggestedTime,
      minReturnTime,
    };
  }

  return { isValid: true };
}

/**
 * Filtre les créneaux horaires disponibles pour le retour en cas de same-day booking
 * Retourne tous les créneaux si ce n'est pas un same-day booking
 * Retourne uniquement les créneaux > heure de départ si c'est un same-day booking
 */
export function getAvailableEndTimeSlots(
  dateFrom: Date | undefined,
  dateTo: Date | undefined,
  startTime: string | undefined,
  timeSlots: string[]
): string[] {
  // Si pas de same-day booking, toutes les heures sont disponibles
  if (!dateFrom || !dateTo || !startTime) {
    return timeSlots;
  }

  const isSameDayBooking = dateFrom.getTime() === dateTo.getTime();
  if (!isSameDayBooking) {
    return timeSlots;
  }

  // Pour same-day : filtrer les heures > startTime
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;

  return timeSlots.filter((slot) => {
    const [slotHour, slotMinute] = slot.split(":").map(Number);
    const slotMinutes = slotHour * 60 + slotMinute;
    return slotMinutes > startMinutes;
  });
}

/**
 * Vérifie si une réservation est toujours valide (non expirée)
 * Une réservation est valide si:
 * - status = "paid" (toujours valide)
 * - status = "pending_payment" ET expires_at > maintenant
 */
export interface BookingWithExpiration {
  status: string;
  expires_at?: string | null;
}

export function isBookingStillValid(booking: BookingWithExpiration): boolean {
  // Les réservations payées sont toujours valides
  if (booking.status === "paid") {
    return true;
  }

  // Pour les pending_payment, vérifier l'expiration
  if (booking.status === "pending_payment") {
    // Si pas d'expires_at, considérer comme expiré (sécurité)
    if (!booking.expires_at) {
      return false;
    }

    const expiresAt = new Date(booking.expires_at);
    const now = new Date();

    // Valide si expires_at est dans le futur
    return expiresAt > now;
  }

  // Autres statuts (cancelled, expired, etc.) = non valide
  return false;
}
