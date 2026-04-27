import type { AgencyRepository } from "@/domain/agency";
import type { BookingRepository } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type { DocumentRepository } from "@/domain/document";
import type { OptionRepository } from "@/domain/option";
import { computeBilledDays } from "@/domain/vehicle";
import { fetchImageAsDataUrl } from "@/lib/pdf/fetch-image-as-data-url";
import type {
  GenerateInvoiceOutcome,
  InvoiceNumberAllocator,
  InvoicePdfData,
  InvoicePdfRenderer,
} from "./generate-invoice/types";
import { buildInvoiceItems } from "./generate-invoice/build-invoice-items";
import { buildInvoicePdfData } from "./generate-invoice/build-pdf-data";

// Re-exports historiques pour les callers externes (composition-root, etc.).
export type {
  InvoiceNumberAllocator,
  InvoicePdfRenderer,
  InvoicePdfData,
  GenerateInvoiceOutcome,
};

interface Deps {
  bookingRepository: BookingRepository;
  customerRepository: CustomerRepository;
  vehicleRepository: VehicleRepository;
  agencyRepository: AgencyRepository;
  optionRepository: OptionRepository;
  documentRepository: DocumentRepository;
  numberAllocator: InvoiceNumberAllocator;
  pdfRenderer: InvoicePdfRenderer;
}

/**
 * Génère ou régénère le PDF de facture pour une réservation. Si une facture
 * existe déjà : même numéro, même date d'émission, le binaire est remplacé.
 * Sinon : nouveau numéro alloué via `numberAllocator`, document créé. */
export const createGenerateInvoiceUseCase = (deps: Deps) => {
  const execute = async (
    bookingId: string,
  ): Promise<GenerateInvoiceOutcome> => {
    const booking = await deps.bookingRepository.findById(bookingId);
    if (!booking) return { kind: "error", message: "Réservation introuvable." };

    const [customer, vehicle, agency] = await Promise.all([
      deps.customerRepository.findById(booking.customerId),
      deps.vehicleRepository.findById(booking.vehicleId),
      deps.agencyRepository.findById(booking.agencyId),
    ]);
    if (!customer || !vehicle || !agency) {
      return { kind: "error", message: "Données de réservation incomplètes." };
    }
    if (!agency.organizationId) {
      return { kind: "error", message: "Organisation de l'agence introuvable." };
    }

    const bookingOptions = await deps.optionRepository.listForBooking(
      booking.id,
    );

    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const numberOfDays = Math.max(1, computeBilledDays(startDate, endDate));

    const { items, pricePerDay } = buildInvoiceItems({
      vehicle,
      bookingOptions,
      bookingTotalPrice: booking.totalPrice,
      startDate,
      endDate,
      numberOfDays,
    });

    // Facture existante ? → régénération (même numéro, nouveau PDF).
    const existing = await deps.documentRepository.findInvoiceByBooking(
      booking.id,
    );
    const invoiceNumber =
      existing?.invoiceNumber ??
      (await deps.numberAllocator.allocate(
        agency.organizationId,
        new Date().getFullYear(),
      ));
    const issuedAt = existing ? new Date(existing.createdAt) : new Date();

    const logoDataUrl = await fetchImageAsDataUrl(
      agency.logoDarkUrl ?? agency.logoUrl ?? null,
    );

    const pdfData = buildInvoicePdfData({
      invoiceNumber,
      issuedAt,
      agency,
      customer,
      vehicle,
      startDate,
      endDate,
      numberOfDays,
      pricePerDay,
      items,
      totalTTC: booking.totalPrice,
      logoDataUrl,
    });

    const pdfBuffer = await deps.pdfRenderer.render(pdfData);
    const fileName = `${invoiceNumber}.pdf`;

    if (existing) {
      const updated = await deps.documentRepository.replaceContent(
        existing.id,
        pdfBuffer,
        "application/pdf",
      );
      if (!updated) {
        return { kind: "error", message: "Échec de la régénération." };
      }
      return { kind: "regenerated", document: updated };
    }

    // Path stable pour faciliter la régénération future (même organisation,
    // même agence, même numéro → même emplacement).
    const filePath = `${agency.organizationId}/${agency.id}/invoice/${fileName}`;
    const created = await deps.documentRepository.create({
      agencyId: agency.id,
      bookingId: booking.id,
      type: "invoice",
      content: pdfBuffer,
      fileName,
      mimeType: "application/pdf",
      invoiceNumber,
      filePath,
      upsert: true,
    });
    return { kind: "created", document: created };
  };

  return { execute };
};

export type GenerateInvoiceUseCase = ReturnType<
  typeof createGenerateInvoiceUseCase
>;
