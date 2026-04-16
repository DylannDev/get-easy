import type { AgencyRepository } from "@/domain/agency";
import type { BookingRepository } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type { DocumentRepository, Document } from "@/domain/document";
import type { OptionRepository } from "@/domain/option";
import { computeBilledDays } from "@/domain/vehicle";
import { getCountryName } from "@/lib/countries";
import { fetchImageAsDataUrl } from "@/lib/pdf/fetch-image-as-data-url";

/**
 * Ports spécifiques à la génération de facture : numérotation et rendu PDF.
 * Implémentés côté infrastructure pour que la couche application reste
 * agnostique (testable sans Supabase ni @react-pdf/renderer).
 */
export interface InvoiceNumberAllocator {
  allocate(organizationId: string, year: number): Promise<string>;
}

export interface InvoicePdfRenderer {
  /**
   * Produit un Buffer PDF à partir des données de facture. L'implémentation
   * importe `@react-pdf/renderer` dynamiquement pour ne pas polluer le bundle
   * client.
   */
  render(data: InvoicePdfData): Promise<Buffer>;
}

// Ré-export du type attendu par le renderer (évite un import croisé depuis le
// template PDF côté application).
export interface InvoicePdfData {
  invoiceNumber: string;
  issuedAt: Date;
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
  bookingRepository: BookingRepository;
  customerRepository: CustomerRepository;
  vehicleRepository: VehicleRepository;
  agencyRepository: AgencyRepository;
  optionRepository: OptionRepository;
  documentRepository: DocumentRepository;
  numberAllocator: InvoiceNumberAllocator;
  pdfRenderer: InvoicePdfRenderer;
}

export type GenerateInvoiceOutcome =
  | { kind: "created"; document: Document }
  | { kind: "regenerated"; document: Document }
  | { kind: "error"; message: string };

export const createGenerateInvoiceUseCase = (deps: Deps) => {
  const execute = async (
    bookingId: string
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
      return {
        kind: "error",
        message: "Organisation de l'agence introuvable.",
      };
    }

    // Options attachées : on utilise les snapshots persistés pour que le PDF
    // reflète exactement ce qui a été facturé au moment de la réservation.
    const bookingOptions = await deps.optionRepository.listForBooking(
      booking.id
    );

    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const numberOfDays = Math.max(1, computeBilledDays(startDate, endDate));

    // Le prix facturé doit refléter ce que le client a réellement payé,
    // indépendamment d'éventuels changements de tarif ultérieurs. On
    // reconstitue donc le prix/jour véhicule en retirant du `totalPrice` du
    // booking (autoritaire, posté par Stripe) la somme des options facturées
    // à partir de leurs snapshots.
    const optionsTotalSnapshot = bookingOptions.reduce((acc, bo) => {
      const line =
        bo.priceTypeSnapshot === "per_day"
          ? bo.unitPriceSnapshot * bo.quantity * numberOfDays
          : bo.unitPriceSnapshot * bo.quantity;
      return acc + line;
    }, 0);
    const vehicleTotal = Math.max(0, booking.totalPrice - optionsTotalSnapshot);
    const pricePerDay = vehicleTotal / numberOfDays;

    const items: InvoicePdfData["items"] = [
      {
        label: `Location ${vehicle.brand} ${vehicle.model} du ${startDate.toLocaleDateString("fr-FR")} au ${endDate.toLocaleDateString("fr-FR")}`,
        quantity: numberOfDays,
        unitPriceTTC: pricePerDay,
        totalTTC: vehicleTotal,
      },
      ...bookingOptions.map((bo) => {
        const isPerDay = bo.priceTypeSnapshot === "per_day";
        const totalForLine = isPerDay
          ? bo.unitPriceSnapshot * bo.quantity * numberOfDays
          : bo.unitPriceSnapshot * bo.quantity;
        const label = isPerDay
          ? `${bo.nameSnapshot} (${bo.unitPriceSnapshot.toFixed(2)} €/j × ${numberOfDays} j)`
          : `${bo.nameSnapshot} (forfait)`;
        return {
          label,
          quantity: bo.quantity,
          unitPriceTTC: isPerDay
            ? bo.unitPriceSnapshot * numberOfDays
            : bo.unitPriceSnapshot,
          totalTTC: totalForLine,
        };
      }),
    ];
    // Référence autoritaire du montant facturé.
    const totalTTC = booking.totalPrice;

    // Facture existante ? → régénération (même numéro, nouveau PDF).
    const existing = await deps.documentRepository.findInvoiceByBooking(
      booking.id
    );

    const invoiceNumber =
      existing?.invoiceNumber ??
      (await deps.numberAllocator.allocate(
        agency.organizationId,
        new Date().getFullYear()
      ));

    const issuedAt = existing
      ? new Date(existing.createdAt) // conserve la date d'émission initiale
      : new Date();

    // Charge le logo (foncé en priorité) en base64 pour @react-pdf/renderer.
    const logoDataUrl = await fetchImageAsDataUrl(
      agency.logoDarkUrl ?? agency.logoUrl ?? null
    );

    const pdfData: InvoicePdfData = {
      invoiceNumber,
      issuedAt,
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
        // Data URL base64 — @react-pdf/renderer peut l'intégrer sans devoir
        // fetcher une URL distante au moment du rendu.
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
        // Le client stocke le code ISO (ex. "GF") → on résout en nom long
        // pour la facture, avec fallback sur le code si non résolvable.
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

    const fileName = `${invoiceNumber}.pdf`;

    if (existing) {
      // Régénération : on remplace le binaire au même chemin, on garde la
      // même ligne documents (numéro + date d'émission préservés).
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
