import type { Vehicle } from "@/types";

export interface Booking {
  id?: string; // Optionnel pour compatibilité avec VehicleBooking
  start_date: string;
  end_date: string;
  status: string;
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
  // On ne prend en compte que les réservations qui sont payées OU pending_payment
  // Note: Les bookings pending_payment expirés sont automatiquement mis à jour par le cron job
  const hasBookingOverlap = bookings.some((booking) => {
    // Ignore les réservations qui ne sont pas paid ou pending_payment
    if (!["pending_payment", "paid"].includes(booking.status)) {
      return false;
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
 * Filtre un tableau de bookings en excluant celui dont l'ID correspond au currentBookingId
 * Utile pour permettre à l'utilisateur de modifier ses propres réservations sans être bloqué
 *
 * IMPORTANT: Un booking avec status="paid" n'est JAMAIS exclu, même s'il correspond au currentBookingId
 * Car une réservation payée ne peut plus être modifiée et doit toujours bloquer les dates
 *
 * @param bookings - Liste des réservations
 * @param excludeBookingId - ID du booking à exclure (optionnel)
 * @returns Liste des bookings filtrée
 */
export function filterOutCurrentBooking(
  bookings: Booking[],
  excludeBookingId?: string | null
): Booking[] {
  if (!excludeBookingId) {
    return bookings;
  }

  return bookings.filter((booking) => {
    // SÉCURITÉ: Ne JAMAIS exclure un booking "paid", même si c'est le booking courant
    if (booking.status === "paid") {
      return true; // Toujours garder les bookings payés
    }

    // Pour les autres status, exclure si c'est le booking courant
    return booking.id !== excludeBookingId;
  });
}

/**
 * Retourne les dates qui sont bloquées pour un véhicule donné
 * (combinaison de blocked_periods et bookings actifs)
 *
 * @param vehicle - Le véhicule
 * @param bookings - Liste des réservations existantes pour ce véhicule
 * @param excludeBookingId - ID du booking à exclure (optionnel, pour ignorer le booking courant)
 * @returns Tableau de dates bloquées au format Date
 */
export function getBlockedDatesForVehicle(
  vehicle: Vehicle,
  bookings: Booking[] = [],
  excludeBookingId?: string | null
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

  // 2. Filtrer les bookings pour exclure le booking courant
  const filteredBookings = filterOutCurrentBooking(bookings, excludeBookingId);

  // 3. Ajouter les dates des bookings actifs (payés OU pending_payment)
  // Note: Les bookings pending_payment expirés sont automatiquement mis à jour par le cron job
  filteredBookings.forEach((booking) => {
    if (!["pending_payment", "paid"].includes(booking.status)) {
      return;
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
  // - Ne garder que paid OU pending_payment
  // Note: Les bookings pending_payment expirés sont automatiquement mis à jour par le cron job
  const relevantBookings = allBookings.filter((booking) => {
    // Exclure le booking courant
    if (booking.id === excludeBookingId) {
      return false;
    }

    // Ne garder que paid ou pending_payment
    if (!["pending_payment", "paid"].includes(booking.status)) {
      return false;
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
