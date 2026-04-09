import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { OpeningHours } from "@/domain/agency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTimeSlots(hours: OpeningHours): string[] {
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
 * Filtre les créneaux horaires de départ en fonction de la date sélectionnée
 * Si la date sélectionnée est aujourd'hui, filtre les heures déjà passées
 * Sinon, retourne tous les créneaux disponibles
 *
 * @param selectedDate - Date de départ sélectionnée
 * @param timeSlots - Tous les créneaux horaires disponibles
 * @returns Créneaux horaires filtrés
 */
export function getAvailableStartTimeSlots(
  selectedDate: Date | undefined,
  timeSlots: string[]
): string[] {
  if (!selectedDate) return timeSlots;

  const normalizedSelectedDate = new Date(selectedDate);
  normalizedSelectedDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Si la date sélectionnée n'est pas aujourd'hui, tous les créneaux sont disponibles
  if (normalizedSelectedDate.getTime() !== today.getTime()) {
    return timeSlots;
  }

  // Si c'est aujourd'hui, filtrer les heures passées
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  return timeSlots.filter((timeSlot) => {
    const [hours, minutes] = timeSlot.split(":").map(Number);
    return hours > currentHours || (hours === currentHours && minutes > currentMinutes);
  });
}

/**
 * Détermine si la date du jour doit être désactivée dans le calendrier
 * Elle est désactivée si aucun créneau horaire n'est disponible aujourd'hui
 *
 * @param timeSlots - Tous les créneaux horaires disponibles
 * @returns true si la date du jour doit être désactivée
 */
export function isTodayDisabledForBooking(timeSlots: string[]): boolean {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  // Vérifier s'il existe au moins un créneau disponible aujourd'hui
  const hasAvailableSlots = timeSlots.some((timeSlot) => {
    const [hours, minutes] = timeSlot.split(":").map(Number);
    return hours > currentHours || (hours === currentHours && minutes > currentMinutes);
  });

  return !hasAvailableSlots;
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

/**
 * Ajoute un paramètre de cache-busting à une URL d'image
 * Pour forcer le rafraîchissement du cache navigateur
 * N'ajoute le paramètre que pour les URLs externes (Supabase), pas les images locales
 *
 * @param imageUrl - URL de l'image
 * @param version - Version optionnelle (par défaut: date du jour au format YYYYMMDD)
 * @returns URL avec paramètre de cache-busting
 */
export function addImageCacheBusting(imageUrl: string, version?: string): string {
  if (!imageUrl) return imageUrl;

  // Ne pas ajouter de cache-busting pour les images locales (commençant par /)
  if (imageUrl.startsWith('/')) return imageUrl;

  // Utiliser la date du jour comme version par défaut
  const defaultVersion = version || new Date().toISOString().split('T')[0].replace(/-/g, '');

  // Vérifier si l'URL contient déjà des paramètres
  const separator = imageUrl.includes('?') ? '&' : '?';

  return `${imageUrl}${separator}v=${defaultVersion}`;
}
