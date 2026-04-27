import type { AgencyRepository } from "@/domain/agency";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type { DocumentRepository } from "@/domain/document";
import type { QuoteRepository } from "@/domain/quote";
import { computeBilledDays } from "@/domain/vehicle";
import { fetchImageAsDataUrl } from "@/lib/pdf/fetch-image-as-data-url";
import type {
  GenerateQuoteOutcome,
  QuoteNumberAllocator,
  QuotePdfData,
  QuotePdfRenderer,
} from "./generate-quote/types";
import { buildQuoteItems } from "./generate-quote/build-quote-items";
import { buildQuotePdfData } from "./generate-quote/build-pdf-data";

// Re-exports historiques pour les callers externes (composition-root, etc.).
export type {
  QuoteNumberAllocator,
  QuotePdfRenderer,
  QuotePdfData,
  GenerateQuoteOutcome,
};

interface Deps {
  quoteRepository: QuoteRepository;
  customerRepository: CustomerRepository;
  vehicleRepository: VehicleRepository;
  agencyRepository: AgencyRepository;
  documentRepository: DocumentRepository;
  numberAllocator: QuoteNumberAllocator;
  pdfRenderer: QuotePdfRenderer;
}

/**
 * Génère ou régénère le PDF de devis pour un quote. Si un PDF existe déjà :
 * même numéro, même date d'émission, le binaire est remplacé. Sinon :
 * nouveau numéro alloué et nouveau document créé. La validité court
 * jusqu'à 23h59 du jour `validUntil`. */
export const createGenerateQuoteUseCase = (deps: Deps) => {
  const execute = async (quoteId: string): Promise<GenerateQuoteOutcome> => {
    const quote = await deps.quoteRepository.findById(quoteId);
    if (!quote) return { kind: "error", message: "Devis introuvable." };

    const [customer, vehicle, agency] = await Promise.all([
      deps.customerRepository.findById(quote.customerId),
      deps.vehicleRepository.findById(quote.vehicleId),
      deps.agencyRepository.findById(quote.agencyId),
    ]);
    if (!customer || !vehicle || !agency) {
      return { kind: "error", message: "Données du devis incomplètes." };
    }
    if (!agency.organizationId) {
      return { kind: "error", message: "Organisation de l'agence introuvable." };
    }

    const quoteOptions = await deps.quoteRepository.listOptionsForQuote(
      quote.id,
    );

    const startDate = new Date(quote.startDate);
    const endDate = new Date(quote.endDate);
    const numberOfDays = Math.max(1, computeBilledDays(startDate, endDate));

    const { items, pricePerDay } = buildQuoteItems({
      vehicle,
      quote,
      quoteOptions,
      startDate,
      endDate,
      numberOfDays,
    });

    const existing = await deps.documentRepository.findQuoteDocumentByQuoteId(
      quote.id,
    );
    const quoteNumber =
      existing?.quoteNumber ??
      (await deps.numberAllocator.allocate(
        agency.organizationId,
        new Date().getFullYear(),
      ));
    const issuedAt = existing ? new Date(existing.createdAt) : new Date();
    const validUntil = new Date(quote.validUntil + "T23:59:59");

    const logoDataUrl = await fetchImageAsDataUrl(
      agency.logoDarkUrl ?? agency.logoUrl ?? null,
    );

    const pdfData = buildQuotePdfData({
      quoteNumber,
      issuedAt,
      validUntil,
      agency,
      customer,
      vehicle,
      startDate,
      endDate,
      numberOfDays,
      pricePerDay,
      items,
      totalTTC: quote.totalPrice,
      logoDataUrl,
    });

    const pdfBuffer = await deps.pdfRenderer.render(pdfData);
    const fileName = `${quoteNumber}.pdf`;

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

    // Path stable : <org>/<agency>/quote/<DEV-YYYY-NNN>.pdf
    const filePath = `${agency.organizationId}/${agency.id}/quote/${fileName}`;
    const created = await deps.documentRepository.create({
      agencyId: agency.id,
      quoteId: quote.id,
      type: "quote",
      content: pdfBuffer,
      fileName,
      mimeType: "application/pdf",
      quoteNumber,
      filePath,
      upsert: true,
    });
    return { kind: "created", document: created };
  };

  return { execute };
};

export type GenerateQuoteUseCase = ReturnType<typeof createGenerateQuoteUseCase>;
