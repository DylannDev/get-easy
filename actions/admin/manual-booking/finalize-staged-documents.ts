import type { AgencyRepository } from "@/domain/agency";
import type { CustomerDocumentRepository } from "@/domain/customer-document";
import type { StagedDocumentInput } from "./types";



interface Args {
  customerDocumentRepository: CustomerDocumentRepository;
  agencyRepository: AgencyRepository;
  agencyId: string;
  customerId: string;
  bookingId: string;
  stagedDocuments: StagedDocumentInput[];
}

/**
 * Matérialise les pièces jointes en staging (déjà uploadées par le client
 * via `uploadStagedCustomerDocument`) vers la table `customer_documents` et
 * leur emplacement de stockage final. Les erreurs sont silencieuses (les
 * pièces jointes sont facultatives — un échec ne doit pas bloquer la
 * création/mise à jour de la réservation).
 */
export async function finalizeStagedDocuments({
  customerDocumentRepository,
  agencyRepository,
  agencyId,
  customerId,
  bookingId,
  stagedDocuments,
}: Args): Promise<void> {
  if (stagedDocuments.length === 0) return;
  const agency = await agencyRepository.findById(agencyId);
  if (!agency?.organizationId) return;

  await Promise.all(
    stagedDocuments.map(async (doc) => {
      try {
        await customerDocumentRepository.finalizeFromStaging({
          stagingKey: doc.stagingKey,
          customerId,
          bookingId,
          type: doc.type,
          organizationId: agency.organizationId!,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          size: doc.size,
        });
      } catch (e) {
        console.error(
          `[manual-booking] Failed to finalize customer document (${doc.type}):`,
          e,
        );
      }
    }),
  );
}
