import type { BookingRepository } from "@/domain/booking";

interface Args {
  bookingRepository: BookingRepository;
  bookingId: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
}

/**
 * V3 — vérifie qu'aucune autre réservation `paid` ne chevauche les dates
 * (race condition possible entre Stripe webhook et un autre client qui
 * vient juste de payer le même véhicule). La requête SQL en amont est un
 * filtre grossier ; on réapplique un overlap au jour entier ici pour être
 * sûr (ignore l'heure : 14:00 → 16:00 et 18:00 → 20:00 le même jour =
 * conflit).
 */
export async function hasPaidConflict({
  bookingRepository,
  bookingId,
  vehicleId,
  startDate,
  endDate,
}: Args): Promise<boolean> {
  const conflicts = await bookingRepository.findPaidConflicts({
    vehicleId,
    startDate,
    endDate,
    excludeBookingId: bookingId,
  });

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  return conflicts.some((other) => {
    const oStart = new Date(other.start_date);
    oStart.setHours(0, 0, 0, 0);
    const oEnd = new Date(other.end_date);
    oEnd.setHours(0, 0, 0, 0);
    return start <= oEnd && end >= oStart;
  });
}
