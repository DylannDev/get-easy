"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/composition-root/container";
import { BookingStatus } from "@/domain/booking";

interface UpdateBookingStatusInput {
  bookingId: string;
  newStatus: BookingStatus;
}

interface UpdateBookingStatusResult {
  ok: boolean;
  error?: string;
}

/**
 * Permet à la gérante de changer le statut d'une réservation manuellement
 * (cas typique : un client dont le paiement a échoué se déplace en agence
 * pour payer en main propre → on passe la résa de `payment_failed` à
 * `paid` sans recréer une nouvelle ligne).
 *
 * Effets de bord :
 *  - passage à `paid` (depuis n'importe quel autre statut) : génération
 *    automatique de la facture (la gérante peut ensuite l'envoyer au
 *    client via "Envoyer par mail").
 *  - autres transitions : simple update du statut.
 *
 * Pas de notification email/SMS auto — la gérante voit le client sur
 * place et déclenche manuellement les communications si besoin.
 */
export async function updateBookingStatus(
  input: UpdateBookingStatusInput
): Promise<UpdateBookingStatusResult> {
  const { bookingRepository, generateInvoiceUseCase } = getContainer();

  const booking = await bookingRepository.findById(input.bookingId);
  if (!booking) return { ok: false, error: "Réservation introuvable." };

  if (booking.status === input.newStatus) {
    return { ok: false, error: "Le statut est déjà celui-là." };
  }

  await bookingRepository.update(input.bookingId, {
    status: input.newStatus,
  });

  // Side effect : génération de la facture si on passe à paid (et qu'on
  // n'y était pas déjà). Erreur loggée mais non bloquante — la gérante
  // peut régénérer manuellement depuis la fiche réservation.
  if (
    input.newStatus === BookingStatus.Paid &&
    booking.status !== BookingStatus.Paid
  ) {
    try {
      await generateInvoiceUseCase.execute(input.bookingId);
    } catch (e) {
      console.error("[update-booking-status] Invoice generation failed:", e);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath(`/admin/reservations/${input.bookingId}`);
  revalidatePath("/admin/planning");
  return { ok: true };
}
