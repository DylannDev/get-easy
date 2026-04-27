import type { CustomerRepository } from "@/domain/customer";
import type { BookingRepository } from "@/domain/booking";
import type { QuoteRepository } from "@/domain/quote";
import type { CustomerDocumentRepository } from "@/domain/customer-document";
import type { DocumentRepository } from "@/domain/document";
import type { DeleteBookingUseCase } from "./delete-booking.use-case";

interface Deps {
  customerRepository: CustomerRepository;
  bookingRepository: BookingRepository;
  quoteRepository: QuoteRepository;
  customerDocumentRepository: CustomerDocumentRepository;
  documentRepository: DocumentRepository;
  deleteBookingUseCase: DeleteBookingUseCase;
}

export type DeleteCustomerOutcome =
  | { kind: "deleted" }
  | { kind: "not_found" }
  | { kind: "error"; message: string };

/**
 * Supprime définitivement un client et **tout** ce qui lui est rattaché :
 *  - Toutes ses réservations + leurs artefacts (factures, contrats, EDL,
 *    photos…) via `deleteBookingUseCase` qui gère le cleanup Storage
 *    et la cascade BDD.
 *  - Tous ses devis + leurs PDFs en Storage. La FK `quotes.customer_id`
 *    est `RESTRICT` côté BDD : il faut supprimer manuellement avant le
 *    customer.
 *  - Toutes ses pièces justificatives (permis, ID, justif domicile) —
 *    Storage + DB. La FK est CASCADE mais on supprime explicitement
 *    pour nettoyer Storage.
 *  - Le client lui-même — la cascade BDD nettoie les rows résiduels.
 */
export const createDeleteCustomerUseCase = (deps: Deps) => {
  const execute = async (
    customerId: string
  ): Promise<DeleteCustomerOutcome> => {
    const customer = await deps.customerRepository.findById(customerId);
    if (!customer) return { kind: "not_found" };

    try {
      // 1. Supprime toutes les résa du client (avec leur cleanup complet).
      const bookings =
        await deps.bookingRepository.findAllByCustomerId(customerId);
      for (const booking of bookings) {
        await deps.deleteBookingUseCase.execute(booking.id);
      }

      // 2. Supprime tous les devis du client (FK RESTRICT — sinon le
      //    delete customer en bout échoue).
      const quotes = await deps.quoteRepository.listByCustomerId(customerId);
      for (const quote of quotes) {
        // Supprime d'abord le document PDF lié (Storage + ligne docs)
        // sinon il reste orphelin.
        const quoteDoc = await deps.documentRepository
          .findQuoteDocumentByQuoteId(quote.id)
          .catch(() => null);
        if (quoteDoc) {
          try {
            await deps.documentRepository.delete(quoteDoc.id);
          } catch (e) {
            console.error(
              `[delete-customer] Failed to delete quote document ${quoteDoc.id}:`,
              e
            );
          }
        }
        try {
          await deps.quoteRepository.delete(quote.id);
        } catch (e) {
          console.error(
            `[delete-customer] Failed to delete quote ${quote.id}:`,
            e
          );
        }
      }

      // 3. Supprime toutes les pièces justificatives (Storage + DB). La
      //    cascade BDD nettoierait les rows mais pas les fichiers Storage.
      const customerDocs =
        await deps.customerDocumentRepository.listByCustomer(customerId);
      for (const doc of customerDocs) {
        try {
          await deps.customerDocumentRepository.delete(doc.id);
        } catch (e) {
          console.error(
            `[delete-customer] Failed to delete customer document ${doc.id}:`,
            e
          );
        }
      }

      // 4. Supprime le client — cascade DB pour les rows résiduels.
      await deps.customerRepository.delete(customerId);

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

export type DeleteCustomerUseCase = ReturnType<
  typeof createDeleteCustomerUseCase
>;
