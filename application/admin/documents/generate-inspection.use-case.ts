import type { AgencyRepository } from "@/domain/agency";
import type { BookingRepository } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type { DocumentRepository, Document } from "@/domain/document";
import type { InspectionRepository } from "@/domain/inspection";
import { getCountryName } from "@/lib/countries";
import { fetchImageAsDataUrl } from "@/lib/pdf/fetch-image-as-data-url";
import { createAdminClient } from "@/infrastructure/supabase/client";

/**
 * Port de rendu PDF — câblé via le composition-root.
 */
export interface InspectionPdfRenderer {
  render(data: InspectionPdfData): Promise<Buffer>;
}

export interface InspectionPdfData {
  type: "departure" | "return";
  issuedAt: Date;
  agency: {
    name: string;
    address: string;
    city: string;
    postalCode?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    legalForm?: string | null;
    capitalSocial?: string | null;
    rcsCity?: string | null;
    rcsNumber?: string | null;
    siret?: string | null;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  vehicle: {
    brand: string;
    model: string;
    registrationPlate: string;
  };
  startDate: Date;
  endDate: Date;
  mileage: number | null;
  fuelLevel: string | null;
  notes: string | null;
  photos: { dataUrl: string; note: string | null }[];
  customerSignature: string | null;
}

interface Deps {
  inspectionRepository: InspectionRepository;
  bookingRepository: BookingRepository;
  customerRepository: CustomerRepository;
  vehicleRepository: VehicleRepository;
  agencyRepository: AgencyRepository;
  documentRepository: DocumentRepository;
  pdfRenderer: InspectionPdfRenderer;
}

export type GenerateInspectionOutcome =
  | { kind: "created"; document: Document }
  | { kind: "regenerated"; document: Document }
  | { kind: "error"; message: string };

const BUCKET = "documents";

export const createGenerateInspectionUseCase = (deps: Deps) => {
  /**
   * Charge une photo du Storage en data URL base64 pour l'insérer dans
   * le PDF via @react-pdf/renderer (qui n'accepte pas les URLs signées
   * directement — elles expirent et il n'y a pas de cookie auth côté
   * serveur pour les fetcher).
   */
  const fetchPhotoAsDataUrl = async (
    filePath: string,
    mimeType: string
  ): Promise<string> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(filePath);
    if (error || !data) return "";
    const arrayBuffer = await data.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${mimeType};base64,${base64}`;
  };

  const execute = async (
    reportId: string
  ): Promise<GenerateInspectionOutcome> => {
    const report = await deps.inspectionRepository.findById(reportId);
    if (!report) {
      return { kind: "error", message: "Rapport d'inspection introuvable." };
    }

    const booking = await deps.bookingRepository.findById(report.bookingId);
    if (!booking) {
      return { kind: "error", message: "Réservation introuvable." };
    }

    const [customer, vehicle, agency] = await Promise.all([
      deps.customerRepository.findById(booking.customerId),
      deps.vehicleRepository.findById(booking.vehicleId),
      deps.agencyRepository.findById(booking.agencyId),
    ]);
    if (!customer || !vehicle || !agency) {
      return {
        kind: "error",
        message: "Données de réservation incomplètes.",
      };
    }
    if (!agency.organizationId) {
      return {
        kind: "error",
        message: "Organisation de l'agence introuvable.",
      };
    }

    // Charge les photos en data URL (base64) pour le renderer.
    const photos = await deps.inspectionRepository.listPhotos(reportId);
    const photosData = await Promise.all(
      photos.map(async (p) => ({
        dataUrl: await fetchPhotoAsDataUrl(p.filePath, p.mimeType),
        note: p.note,
      }))
    );

    const logoDataUrl = await fetchImageAsDataUrl(
      agency.logoDarkUrl ?? agency.logoUrl ?? null
    );

    const pdfData: InspectionPdfData = {
      type: report.type,
      issuedAt: report.signedAt ? new Date(report.signedAt) : new Date(),
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
        logoUrl: logoDataUrl,
        legalForm: agency.legalForm ?? null,
        capitalSocial: agency.capitalSocial ?? null,
        rcsCity: agency.rcsCity ?? null,
        rcsNumber: agency.rcsNumber ?? null,
        siret: agency.siret ?? null,
      },
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
      vehicle: {
        brand: vehicle.brand,
        model: vehicle.model,
        registrationPlate: vehicle.registrationPlate,
      },
      startDate: new Date(booking.startDate),
      endDate: new Date(booking.endDate),
      mileage: report.mileage,
      fuelLevel: report.fuelLevel,
      notes: report.notes,
      photos: photosData.filter((p) => p.dataUrl),
      customerSignature: report.customerSignature,
    };

    const pdfBuffer = await deps.pdfRenderer.render(pdfData);

    const typeLabel = report.type === "departure" ? "depart" : "retour";
    const fileName = `EDL-${typeLabel}-${booking.id.slice(0, 8)}.pdf`;

    // Cherche un document existant pour ce rapport (régénération).
    const existingDocs = await deps.documentRepository.listByBooking(
      booking.id
    );
    const existing = existingDocs.find(
      (d) =>
        d.type === "inspection" &&
        d.inspectionReportId === reportId
    );

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

    const filePath = `${agency.organizationId}/${agency.id}/inspection/${fileName}`;

    const created = await deps.documentRepository.create({
      agencyId: agency.id,
      bookingId: booking.id,
      inspectionReportId: reportId,
      type: "inspection",
      content: pdfBuffer,
      fileName,
      mimeType: "application/pdf",
      filePath,
      upsert: true,
    });
    return { kind: "created", document: created };
  };

  return { execute };
};

export type GenerateInspectionUseCase = ReturnType<
  typeof createGenerateInspectionUseCase
>;
