import type { AgencyRepository } from "@/domain/agency";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type { DocumentRepository, Document } from "@/domain/document";
import type { QuoteRepository } from "@/domain/quote";
import { computeBilledDays } from "@/domain/vehicle";
import { computeOptionLineTotal } from "@/domain/option";
import { getCountryName } from "@/lib/countries";
import { fetchImageAsDataUrl } from "@/lib/pdf/fetch-image-as-data-url";

/**
 * Ports spécifiques à la génération du devis — miroir de ceux de la
 * facture (numérotation + rendu PDF), câblés dans le composition-root.
 */
export interface QuoteNumberAllocator {
  allocate(organizationId: string, year: number): Promise<string>;
}

export interface QuotePdfRenderer {
  render(data: QuotePdfData): Promise<Buffer>;
}

export interface QuotePdfData {
  quoteNumber: string;
  issuedAt: Date;
  validUntil: Date;
  agency: {
    name: string;
    address: string;
    city: string;
    postalCode?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    legalForm?: string | null;
    capitalSocial?: string | null;
    rcsCity?: string | null;
    rcsNumber?: string | null;
    siret?: string | null;
    tvaIntracom?: string | null;
    logoUrl?: string | null;
    vatEnabled: boolean;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
  };
  vehicle: { brand: string; model: string; registrationPlate: string };
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  pricePerDay: number;
  items: {
    label: string;
    quantity: number;
    unitPriceTTC: number;
    totalTTC: number;
  }[];
  totalTTC: number;
}

interface Deps {
  quoteRepository: QuoteRepository;
  customerRepository: CustomerRepository;
  vehicleRepository: VehicleRepository;
  agencyRepository: AgencyRepository;
  documentRepository: DocumentRepository;
  numberAllocator: QuoteNumberAllocator;
  pdfRenderer: QuotePdfRenderer;
}

export type GenerateQuoteOutcome =
  | { kind: "created"; document: Document }
  | { kind: "regenerated"; document: Document }
  | { kind: "error"; message: string };

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
      return {
        kind: "error",
        message: "Organisation de l'agence introuvable.",
      };
    }

    // Options figées lors de la création du devis — on réutilise les
    // snapshots pour que le PDF reste cohérent avec la ligne en BDD,
    // même si l'agence modifie ensuite le tarif de l'option.
    const quoteOptions = await deps.quoteRepository.listOptionsForQuote(
      quote.id
    );

    const startDate = new Date(quote.startDate);
    const endDate = new Date(quote.endDate);
    const numberOfDays = Math.max(1, computeBilledDays(startDate, endDate));

    // `basePrice` déjà figé au moment de la création du devis (gère
    // les tarifs dégressifs + CGL éventuelles). Prix/jour reconstitué
    // pour la colonne "Prix unitaire" de la ligne véhicule du PDF.
    const vehicleTotal = quote.basePrice + quote.cglTotal;
    const pricePerDay = vehicleTotal / numberOfDays;

    const items: QuotePdfData["items"] = [
      {
        label: `Location ${vehicle.brand} ${vehicle.model} du ${startDate.toLocaleDateString("fr-FR")} au ${endDate.toLocaleDateString("fr-FR")}`,
        quantity: numberOfDays,
        unitPriceTTC: pricePerDay,
        totalTTC: vehicleTotal,
      },
      ...quoteOptions.map((qo) => {
        const isPerDay = qo.priceTypeSnapshot === "per_day";
        const totalForLine = computeOptionLineTotal(
          {
            unitPrice: qo.unitPriceSnapshot,
            priceType: qo.priceTypeSnapshot,
            quantity: qo.quantity,
            monthlyCap: qo.monthlyCapSnapshot,
          },
          numberOfDays
        );
        const capSuffix =
          qo.monthlyCapSnapshot != null
            ? ` — plafonné à ${qo.monthlyCapSnapshot.toFixed(2)} €/mois`
            : "";
        const label = isPerDay
          ? `${qo.nameSnapshot} (${qo.unitPriceSnapshot.toFixed(2)} €/j × ${numberOfDays} j${capSuffix})`
          : `${qo.nameSnapshot} (forfait)`;
        return {
          label,
          quantity: qo.quantity,
          unitPriceTTC:
            qo.quantity > 0 ? totalForLine / qo.quantity : totalForLine,
          totalTTC: totalForLine,
        };
      }),
    ];
    const totalTTC = quote.totalPrice;

    // Document existant ? → régénération (même numéro, même path).
    const existing = await deps.documentRepository.findQuoteDocumentByQuoteId(
      quote.id
    );

    const quoteNumber =
      existing?.quoteNumber ??
      (await deps.numberAllocator.allocate(
        agency.organizationId,
        new Date().getFullYear()
      ));

    const issuedAt = existing ? new Date(existing.createdAt) : new Date();
    const validUntil = new Date(quote.validUntil + "T23:59:59");

    const logoDataUrl = await fetchImageAsDataUrl(
      agency.logoDarkUrl ?? agency.logoUrl ?? null
    );

    const pdfData: QuotePdfData = {
      quoteNumber,
      issuedAt,
      validUntil,
      agency: {
        name: agency.name,
        address: agency.address,
        city: agency.city,
        postalCode: agency.postalCode ?? null,
        country: agency.country
          ? getCountryName(agency.country) ?? agency.country
          : null,
        phone: agency.phone ?? null,
        email: agency.email ?? null,
        legalForm: agency.legalForm ?? null,
        capitalSocial: agency.capitalSocial ?? null,
        rcsCity: agency.rcsCity ?? null,
        rcsNumber: agency.rcsNumber ?? null,
        siret: agency.siret ?? null,
        tvaIntracom: agency.tvaIntracom ?? null,
        logoUrl: logoDataUrl,
        vatEnabled: agency.vatEnabled ?? false,
      },
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        postalCode: customer.postalCode,
        city: customer.city,
        country: getCountryName(customer.country) ?? customer.country,
      },
      vehicle: {
        brand: vehicle.brand,
        model: vehicle.model,
        registrationPlate: vehicle.registrationPlate,
      },
      startDate,
      endDate,
      numberOfDays,
      pricePerDay,
      items,
      totalTTC,
    };

    const pdfBuffer = await deps.pdfRenderer.render(pdfData);
    const fileName = `${quoteNumber}.pdf`;

    if (existing) {
      const updated = await deps.documentRepository.replaceContent(
        existing.id,
        pdfBuffer,
        "application/pdf"
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
