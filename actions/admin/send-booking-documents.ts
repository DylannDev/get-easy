"use server";

import { getContainer } from "@/composition-root/container";

export interface SendBookingDocumentsActionInput {
  bookingId: string;
  documentIds: string[];
  recipientEmail?: string;
  labelOverrides?: Record<string, string>;
}

export interface SendBookingDocumentsActionResult {
  ok: boolean;
  error?: string;
}

export async function sendBookingDocuments(
  input: SendBookingDocumentsActionInput
): Promise<SendBookingDocumentsActionResult> {
  const { sendBookingDocumentsUseCase } = getContainer();
  const outcome = await sendBookingDocumentsUseCase.execute(input);

  switch (outcome.kind) {
    case "sent":
      return { ok: true };
    case "rejected_no_documents":
      return { ok: false, error: "Aucun document sélectionné." };
    case "rejected_no_recipient":
      return { ok: false, error: "Aucune adresse email de destinataire." };
    case "rejected_booking_not_found":
      return { ok: false, error: "Réservation introuvable." };
    case "rejected_size_exceeded": {
      const mb = (outcome.totalBytes / 1024 / 1024).toFixed(1);
      const max = Math.round(outcome.maxBytes / 1024 / 1024);
      return {
        ok: false,
        error: `Pièces jointes trop volumineuses (${mb} Mo > ${max} Mo). Envoyez moins de documents à la fois.`,
      };
    }
    case "error":
      return { ok: false, error: outcome.message };
  }
}
