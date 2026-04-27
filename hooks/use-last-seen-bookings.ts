"use client";

const STORAGE_KEY = "reservations_last_seen";

/**
 * Retourne le timestamp de la dernière visite sur /admin/reservations.
 * Stocké dans localStorage pour persister entre les sessions.
 */
export function getLastSeenTimestamp(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Met à jour le timestamp de dernière visite (appelé quand l'admin
 * ouvre la page réservations).
 */
export function markBookingsAsSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
}

/**
 * Vérifie si une réservation est "nouvelle" (créée après la dernière
 * visite de l'admin sur la page réservations).
 */
export function isNewBooking(
  createdAt: string,
  lastSeen: string | null
): boolean {
  if (!lastSeen) return false; // Première visite → rien de "nouveau"
  return new Date(createdAt).getTime() > new Date(lastSeen).getTime();
}
