import { BookingStatus, type Booking, type BookingRepository } from "@/domain/booking";
import { PENDING_PAYMENT_TTL_MS, type StartCheckoutInput } from "./types";

type Result = { ok: true; booking: Booking } | { ok: false; error: string };

interface Args {
  bookingRepository: BookingRepository;
  input: StartCheckoutInput;
  customerId: string;
}

/**
 * Crée la réservation en `pending_payment` ou met à jour celle de l'étape
 * précédente. Statuts source autorisés pour update :
 *  - `initiated`       : 1er passage normal
 *  - `pending_payment` : retry après abandon Stripe (bouton "Retour")
 *  - `payment_failed`  : retry après échec carte (3DS refusée, decline…)
 *
 * Refuse de toucher aux réservations payées, annulées ou expirées (le
 * client doit en créer une nouvelle). Le TTL d'expiration est posé à
 * T + 10 min — synchrone avec la session Stripe Checkout. */
export async function upsertBooking({
  bookingRepository,
  input,
  customerId,
}: Args): Promise<Result> {
  const expiresAt = new Date(Date.now() + PENDING_PAYMENT_TTL_MS).toISOString();
  const startISO = input.startDate.toISOString();
  const endISO = input.endDate.toISOString();

  if (input.bookingId) {
    const existing = await bookingRepository.findById(input.bookingId);
    if (!existing) {
      return {
        ok: false,
        error: "Réservation introuvable. Veuillez réessayer.",
      };
    }
    if (existing.status === BookingStatus.Paid) {
      return {
        ok: false,
        error:
          "Cette réservation a déjà été payée et ne peut plus être modifiée.",
      };
    }
    if (
      existing.status === BookingStatus.Cancelled ||
      existing.status === BookingStatus.Expired
    ) {
      return {
        ok: false,
        error:
          "Cette réservation n'est plus valide. Veuillez créer une nouvelle réservation.",
      };
    }

    const booking = await bookingRepository.update(
      input.bookingId,
      {
        customerId,
        vehicleId: input.vehicleId,
        agencyId: input.agencyId,
        startDate: startISO,
        endDate: endISO,
        totalPrice: input.totalPrice,
        status: BookingStatus.PendingPayment,
        expiresAt,
      },
      {
        expectedStatuses: [
          BookingStatus.Initiated,
          BookingStatus.PendingPayment,
          BookingStatus.PaymentFailed,
        ],
      },
    );

    if (!booking) {
      return {
        ok: false,
        error: "Impossible de mettre à jour la réservation.",
      };
    }
    return { ok: true, booking };
  }

  const booking = await bookingRepository.create({
    customerId,
    vehicleId: input.vehicleId,
    agencyId: input.agencyId,
    startDate: startISO,
    endDate: endISO,
    totalPrice: input.totalPrice,
    status: BookingStatus.PendingPayment,
    expiresAt,
  });
  return { ok: true, booking };
}
