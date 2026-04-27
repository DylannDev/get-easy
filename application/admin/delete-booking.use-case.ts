import type { BookingRepository } from "@/domain/booking";
import type { DocumentRepository } from "@/domain/document";
import type { InspectionRepository } from "@/domain/inspection";

interface Deps {
  bookingRepository: BookingRepository;
  documentRepository: DocumentRepository;
  inspectionRepository: InspectionRepository;
}

export type DeleteBookingOutcome =
  | { kind: "deleted" }
  | { kind: "not_found" }
  | { kind: "error"; message: string };

/**
 * Supprime définitivement une réservation et tous ses artefacts liés.
 *
 * Ordre des opérations :
 *  1. Supprime les `documents` (factures, contrats, EDL PDFs) — Storage
 *     + DB. Nécessaire car la FK `documents.booking_id` est `SET NULL`,
 *     donc les fichiers Storage seraient orphelinsí après cascade.
 *  2. Supprime les photos d'EDL en Storage — `inspection_photos.report_id`
 *     est CASCADE, donc les rows partent avec le rapport, mais les
 *     fichiers Storage doivent être nettoyés explicitement.
 *  3. Supprime la réservation. La cascade BDD nettoie automatiquement :
 *     `booking_options`, `payments`, `inspection_reports` (et
 *     `inspection_photos` via cascade), `booking_contract_fields`.
 *  4. `customer_documents` ont une FK `SET NULL` — les pièces jointes du
 *     client (permis, ID, etc.) survivent et restent attachées au client
 *     pour ses futures réservations.
 */
export const createDeleteBookingUseCase = (deps: Deps) => {
  const execute = async (bookingId: string): Promise<DeleteBookingOutcome> => {
    const booking = await deps.bookingRepository.findById(bookingId);
    if (!booking) return { kind: "not_found" };

    try {
      // 1. Documents (factures, contrats, EDL PDFs) — Storage + DB.
      const docs = await deps.documentRepository.listByBooking(bookingId);
      for (const doc of docs) {
        try {
          await deps.documentRepository.delete(doc.id);
        } catch (e) {
          console.error(
            `[delete-booking] Failed to delete document ${doc.id}:`,
            e
          );
        }
      }

      // 2. Photos d'EDL en Storage. Les rapports d'inspection partiront
      //    en cascade avec la résa, mais leurs fichiers photo doivent
      //    être supprimés explicitement.
      for (const type of ["departure", "return"] as const) {
        const report =
          await deps.inspectionRepository.findByBookingAndType(
            bookingId,
            type
          );
        if (!report) continue;
        const photos = await deps.inspectionRepository.listPhotos(report.id);
        for (const photo of photos) {
          try {
            await deps.inspectionRepository.deletePhoto(photo.id);
          } catch (e) {
            console.error(
              `[delete-booking] Failed to delete inspection photo ${photo.id}:`,
              e
            );
          }
        }
      }

      // 3. Suppression de la résa — cascade nettoie le reste.
      await deps.bookingRepository.delete(bookingId);

      return { kind: "deleted" };
    } catch (e) {
      return {
        kind: "error",
        message: e instanceof Error ? e.message : "Erreur inconnue.",
      };
    }
  };

  return { execute };
};

export type DeleteBookingUseCase = ReturnType<typeof createDeleteBookingUseCase>;
