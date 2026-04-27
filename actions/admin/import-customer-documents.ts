"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";
import type { CustomerDocumentType } from "@/domain/customer-document";

interface StagedDocumentInput {
  stagingKey: string;
  type: CustomerDocumentType;
  fileName: string;
  mimeType: string;
  size: number;
}

interface ImportResult {
  ok: boolean;
  imported?: number;
  error?: string;
}

/**
 * Finalise des pièces jointes en staging et les rattache au client.
 *
 * Deux contextes possibles :
 *  - `bookingId` fourni : appelé depuis la fiche réservation. Le client
 *    et l'organisation sont résolus depuis la résa, et le doc est lié
 *    au booking (`customer_documents.booking_id`).
 *  - `customerId` fourni : appelé depuis la fiche client (sans résa).
 *    L'organisation est celle de l'agence active. `booking_id` reste
 *    `null` — le doc appartient juste au client.
 *
 * Garde-fous : exactement l'un des deux IDs doit être fourni.
 */
export async function importCustomerDocuments(input: {
  bookingId?: string;
  customerId?: string;
  stagedDocuments: StagedDocumentInput[];
}): Promise<ImportResult> {
  if (!input.bookingId && !input.customerId) {
    return { ok: false, error: "bookingId ou customerId requis." };
  }
  if (input.stagedDocuments.length === 0) {
    return { ok: false, error: "Aucun fichier à importer." };
  }

  const {
    bookingRepository,
    customerRepository,
    agencyRepository,
    customerDocumentRepository,
  } = getContainer();

  // Résout customerId + bookingId + organizationId selon le contexte.
  let customerId: string;
  let bookingId: string | null;
  let organizationId: string;
  const revalidatePaths: string[] = [];

  if (input.bookingId) {
    const booking = await bookingRepository.findById(input.bookingId);
    if (!booking) return { ok: false, error: "Réservation introuvable." };
    const agency = await agencyRepository.findById(booking.agencyId);
    if (!agency?.organizationId) {
      return { ok: false, error: "Organisation de l'agence introuvable." };
    }
    customerId = booking.customerId;
    bookingId = input.bookingId;
    organizationId = agency.organizationId;
    revalidatePaths.push(
      `/admin/reservations/${input.bookingId}`,
      `/admin/clients/${customerId}`
    );
  } else {
    const customer = await customerRepository.findById(input.customerId!);
    if (!customer) return { ok: false, error: "Client introuvable." };
    const activeAgencyId = await getActiveAgency();
    const agency = await agencyRepository.findById(activeAgencyId);
    if (!agency?.organizationId) {
      return { ok: false, error: "Organisation introuvable." };
    }
    customerId = customer.id;
    bookingId = null;
    organizationId = agency.organizationId;
    revalidatePaths.push(`/admin/clients/${customerId}`);
  }

  let imported = 0;
  for (const doc of input.stagedDocuments) {
    try {
      await customerDocumentRepository.finalizeFromStaging({
        stagingKey: doc.stagingKey,
        customerId,
        bookingId,
        type: doc.type,
        organizationId,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        size: doc.size,
      });
      imported++;
    } catch (e) {
      console.error(
        `[import-customer-documents] Failed to finalize (${doc.type}):`,
        e
      );
    }
  }

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true, imported };
}
