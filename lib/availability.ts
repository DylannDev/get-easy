import type { Vehicle } from "@/types";

export interface Booking {
  start_date: string;
  end_date: string;
  status: string;
  expires_at?: string | null;
}

/**
 * Vérifie si un véhicule est disponible en tenant compte des périodes bloquées ET des réservations
 *
 * @param vehicle - Le véhicule à vérifier
 * @param requestedStart - Date de début demandée
 * @param requestedEnd - Date de fin demandée
 * @param bookings - Liste des réservations existantes pour ce véhicule
 * @returns true si le véhicule est disponible, false sinon
 */
export function isVehicleAvailableWithBookings(
  vehicle: Vehicle,
  requestedStart: Date,
  requestedEnd: Date,
  bookings: Booking[] = []
): boolean {
  if (requestedEnd <= requestedStart) return false;

  // Normalise les dates de la requête à la journée
  const normalizedRequestStart = new Date(requestedStart);
  const normalizedRequestEnd = new Date(requestedEnd);
  normalizedRequestStart.setHours(0, 0, 0, 0);
  normalizedRequestEnd.setHours(0, 0, 0, 0);

  // 1. Vérifie les périodes bloquées (blocked_periods)
  const hasBlockedOverlap = vehicle.blockedPeriods.some((blocked) => {
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

    return (
      normalizedRequestStart <= blockedEnd &&
      normalizedRequestEnd >= blockedStart
    );
  });

  if (hasBlockedOverlap) return false;

  // 2. Vérifie les réservations existantes (bookings)
  // On ne prend en compte que les réservations qui sont payées OU pending_payment non-expirées
  const hasBookingOverlap = bookings.some((booking) => {
    // Ignore les réservations annulées, échouées, remboursées ou expirées
    if (!["pending_payment", "paid"].includes(booking.status)) {
      return false;
    }

    // Pour les pending_payment, vérifie si la réservation est expirée
    if (booking.status === "pending_payment") {
      if (!booking.expires_at) {
        // Si pas d'expires_at, on considère la réservation comme expirée (sécurité)
        return false;
      }
      const expiresAt = new Date(booking.expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        // La réservation est expirée, elle ne bloque plus les dates
        return false;
      }
    }

    let bookingStart = new Date(booking.start_date);
    let bookingEnd = new Date(booking.end_date);

    // Corrige les périodes inversées
    if (bookingStart > bookingEnd) {
      const tmp = bookingStart;
      bookingStart = bookingEnd;
      bookingEnd = tmp;
    }

    // Normalise les dates de réservation à la journée
    bookingStart.setHours(0, 0, 0, 0);
    bookingEnd.setHours(0, 0, 0, 0);

    return (
      normalizedRequestStart <= bookingEnd &&
      normalizedRequestEnd >= bookingStart
    );
  });

  // Le véhicule est disponible s'il n'y a AUCUN chevauchement
  return !hasBookingOverlap;
}

/**
 * Retourne les dates qui sont bloquées pour un véhicule donné
 * (combinaison de blocked_periods et bookings actifs)
 *
 * @param vehicle - Le véhicule
 * @param bookings - Liste des réservations existantes pour ce véhicule
 * @returns Tableau de dates bloquées au format Date
 */
export function getBlockedDatesForVehicle(
  vehicle: Vehicle,
  bookings: Booking[] = []
): Date[] {
  const blockedDates: Date[] = [];

  // 1. Ajouter les dates des blocked_periods
  vehicle.blockedPeriods.forEach((blocked) => {
    const start = new Date(blocked.start);
    const end = new Date(blocked.end);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const current = new Date(start);
    while (current <= end) {
      blockedDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  });

  // 2. Ajouter les dates des bookings actifs (payés OU pending_payment non-expirés)
  bookings.forEach((booking) => {
    if (!["pending_payment", "paid"].includes(booking.status)) {
      return;
    }

    // Pour les pending_payment, vérifie si la réservation est expirée
    if (booking.status === "pending_payment") {
      if (!booking.expires_at) {
        return; // Pas d'expires_at = considéré comme expiré
      }
      const expiresAt = new Date(booking.expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        return; // Réservation expirée, ne bloque pas les dates
      }
    }

    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const current = new Date(start);
    while (current <= end) {
      blockedDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  });

  return blockedDates;
}

/**
 * Vérifie si une période est disponible pour un véhicule en excluant un booking spécifique
 * Utile pour le webhook Stripe pour vérifier qu'aucun autre booking ne chevauche
 *
 * @param vehicleId - ID du véhicule
 * @param requestedStart - Date de début demandée
 * @param requestedEnd - Date de fin demandée
 * @param excludeBookingId - ID du booking à exclure de la vérification (le booking en cours de paiement)
 * @param allBookings - Tous les bookings du véhicule (incluant expires_at)
 * @returns true si disponible, false si conflit détecté
 */
export function isVehicleAvailableExcludingBooking(
  requestedStart: Date,
  requestedEnd: Date,
  excludeBookingId: string,
  allBookings: Booking[]
): boolean {
  if (requestedEnd <= requestedStart) return false;

  // Normalise les dates de la requête à la journée
  const normalizedRequestStart = new Date(requestedStart);
  const normalizedRequestEnd = new Date(requestedEnd);
  normalizedRequestStart.setHours(0, 0, 0, 0);
  normalizedRequestEnd.setHours(0, 0, 0, 0);

  // Filtre les bookings à vérifier :
  // - Exclure le booking en cours de paiement
  // - Ne garder que paid OU pending_payment non-expirés
  const relevantBookings = allBookings.filter((booking) => {
    // Exclure le booking courant
    if ((booking as any).id === excludeBookingId) {
      return false;
    }

    // Ne garder que paid ou pending_payment
    if (!["pending_payment", "paid"].includes(booking.status)) {
      return false;
    }

    // Pour pending_payment, vérifier l'expiration
    if (booking.status === "pending_payment") {
      if (!booking.expires_at) {
        return false; // Pas d'expires_at = considéré comme expiré
      }
      const expiresAt = new Date(booking.expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        return false; // Expiré
      }
    }

    return true;
  });

  // Vérifie si un des bookings pertinents chevauche la période demandée
  const hasOverlap = relevantBookings.some((booking) => {
    let bookingStart = new Date(booking.start_date);
    let bookingEnd = new Date(booking.end_date);

    // Corrige les périodes inversées
    if (bookingStart > bookingEnd) {
      const tmp = bookingStart;
      bookingStart = bookingEnd;
      bookingEnd = tmp;
    }

    // Normalise les dates de réservation à la journée
    bookingStart.setHours(0, 0, 0, 0);
    bookingEnd.setHours(0, 0, 0, 0);

    return (
      normalizedRequestStart <= bookingEnd &&
      normalizedRequestEnd >= bookingStart
    );
  });

  // Disponible si aucun chevauchement
  return !hasOverlap;
}
