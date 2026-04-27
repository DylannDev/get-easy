import type { BookingRepository } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type { DocumentRepository } from "@/domain/document";
import type {
  Notifier,
  EmailAttachment,
} from "@/application/notifications/notification.port";
import { formatDateCayenne } from "@/lib/format-date";

export interface SendBookingDocumentsInput {
  bookingId: string;
  /** IDs des documents à joindre. Doivent appartenir à la réservation. */
  documentIds: string[];
  /** Email du destinataire. Si absent, on utilise celui du client de la résa. */
  recipientEmail?: string;
  /**
   * Map d'override des libellés des docs (par doc id), ex:
   * `{ [docId]: "État des lieux de départ" }`. Sinon le libellé par défaut
   * est dérivé du `type` du document.
   */
  labelOverrides?: Record<string, string>;
}

export type SendBookingDocumentsOutcome =
  | { kind: "sent"; documentLabels: string[] }
  | { kind: "rejected_no_recipient" }
  | { kind: "rejected_booking_not_found" }
  | { kind: "rejected_no_documents" }
  | { kind: "rejected_size_exceeded"; totalBytes: number; maxBytes: number }
  | { kind: "error"; message: string };

interface Deps {
  bookingRepository: BookingRepository;
  customerRepository: CustomerRepository;
  vehicleRepository: VehicleRepository;
  documentRepository: DocumentRepository;
  notifier: Notifier;
}

// Resend autorise 40 MB par email. Marge de sécurité à 35 MB.
const MAX_TOTAL_BYTES = 35 * 1024 * 1024;

const DEFAULT_LABELS: Record<string, string> = {
  invoice: "Facture",
  contract: "Contrat",
  inspection: "État des lieux",
  quote: "Devis",
  other: "Document",
};

export const createSendBookingDocumentsUseCase = (deps: Deps) => {
  const execute = async (
    input: SendBookingDocumentsInput
  ): Promise<SendBookingDocumentsOutcome> => {
    if (input.documentIds.length === 0) {
      return { kind: "rejected_no_documents" };
    }

    const booking = await deps.bookingRepository.findById(input.bookingId);
    if (!booking) return { kind: "rejected_booking_not_found" };

    const [customer, vehicle] = await Promise.all([
      deps.customerRepository.findById(booking.customerId),
      deps.vehicleRepository.findById(booking.vehicleId),
    ]);

    const recipient = input.recipientEmail?.trim() || customer?.email;
    if (!recipient) return { kind: "rejected_no_recipient" };
    if (!customer || !vehicle) {
      return { kind: "error", message: "Client ou véhicule introuvable." };
    }

    // Téléchargement parallèle des contenus des docs.
    const fetched = await Promise.all(
      input.documentIds.map(async (id) => {
        const doc = await deps.documentRepository.findById(id);
        if (!doc || doc.bookingId !== booking.id) return null;
        const content = await deps.documentRepository.downloadContent(id);
        if (!content) return null;
        return { doc, content };
      })
    );
    const valid = fetched.filter(
      (r): r is { doc: NonNullable<Awaited<ReturnType<typeof deps.documentRepository.findById>>>; content: Buffer } =>
        r !== null
    );
    if (valid.length === 0) return { kind: "rejected_no_documents" };

    const totalBytes = valid.reduce((sum, r) => sum + r.content.byteLength, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      return {
        kind: "rejected_size_exceeded",
        totalBytes,
        maxBytes: MAX_TOTAL_BYTES,
      };
    }

    const attachments: EmailAttachment[] = valid.map(({ doc, content }) => ({
      filename: doc.fileName,
      content,
      contentType: doc.mimeType,
    }));
    const documentLabels = valid.map(({ doc }) =>
      input.labelOverrides?.[doc.id] ?? DEFAULT_LABELS[doc.type] ?? doc.fileName
    );

    const result = await deps.notifier.sendBookingDocumentsToClient({
      to: recipient,
      firstName: customer.firstName,
      lastName: customer.lastName,
      vehicle: { brand: vehicle.brand, model: vehicle.model },
      startDate: formatDateCayenne(booking.startDate, "dd MMMM yyyy"),
      endDate: formatDateCayenne(booking.endDate, "dd MMMM yyyy"),
      attachments,
      documentLabels,
    });

    if (!result.success) {
      return { kind: "error", message: result.error ?? "Envoi échoué." };
    }
    return { kind: "sent", documentLabels };
  };

  return { execute };
};

export type SendBookingDocumentsUseCase = ReturnType<
  typeof createSendBookingDocumentsUseCase
>;
