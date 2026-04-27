"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/composition-root/container";

interface DeleteBookingResult {
  ok: boolean;
  error?: string;
}

/**
 * Supprime définitivement une réservation (avec ses options, paiements,
 * EDL, factures, contrats…). À n'utiliser qu'après confirmation explicite
 * de l'utilisateur (cf. `BookingDeleteDialog` qui demande de re-taper le
 * nom du client).
 */
export async function deleteBookingAction(
  bookingId: string
): Promise<DeleteBookingResult> {
  const { deleteBookingUseCase } = getContainer();
  const outcome = await deleteBookingUseCase.execute(bookingId);

  switch (outcome.kind) {
    case "deleted":
      revalidatePath("/admin");
      revalidatePath("/admin/reservations");
      revalidatePath("/admin/planning");
      revalidatePath("/admin/documents");
      return { ok: true };
    case "not_found":
      return { ok: false, error: "Réservation introuvable." };
    case "error":
      return { ok: false, error: outcome.message };
  }
}
