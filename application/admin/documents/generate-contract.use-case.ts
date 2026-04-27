import type { AgencyRepository } from "@/domain/agency";
import type { BookingRepository } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type { DocumentRepository } from "@/domain/document";
import type { OptionRepository } from "@/domain/option";
import type {
  ContractFieldsRepository,
  ContractEditableFields,
} from "@/domain/contract";
import { computeBilledDays } from "@/domain/vehicle";
import { fetchImageAsDataUrl } from "@/lib/pdf/fetch-image-as-data-url";
import type {
  ContractPdfData,
  ContractPdfRenderer,
  GenerateContractOutcome,
} from "./generate-contract/types";
import { buildDefaultContractFields } from "./generate-contract/build-default-fields";
import { buildContractPdfData } from "./generate-contract/build-pdf-data";
import { computeContractPricing } from "./generate-contract/compute-pricing";

// Re-exports historiques pour les callers externes (composition-root, etc.).
export type {
  ContractPdfData,
  ContractPdfRenderer,
  GenerateContractOutcome,
};
export { buildDefaultContractFields };

interface Deps {
  bookingRepository: BookingRepository;
  customerRepository: CustomerRepository;
  vehicleRepository: VehicleRepository;
  agencyRepository: AgencyRepository;
  optionRepository: OptionRepository;
  documentRepository: DocumentRepository;
  contractFieldsRepository: ContractFieldsRepository;
  pdfRenderer: ContractPdfRenderer;
}

/**
 * Génère ou régénère le PDF du contrat à partir :
 *  - des infos loueur (toujours relues depuis l'agence — jamais stockées
 *    dans les champs éditables)
 *  - des champs sauvegardés dans `booking_contract_fields` (éditeur admin)
 *  - des signatures sauvegardées (embarquées comme images dans le PDF)
 *
 * Si aucun champ n'est encore sauvegardé, on remplit depuis la réservation
 * via `buildDefaultContractFields`. Le merge `{...defaults, ...saved}`
 * garantit que les valeurs sauvegardées (même '') l'emportent sur les
 * défauts. */
export const createGenerateContractUseCase = (deps: Deps) => {
  const execute = async (
    bookingId: string,
  ): Promise<GenerateContractOutcome> => {
    const booking = await deps.bookingRepository.findById(bookingId);
    if (!booking) {
      return { kind: "error", message: "Réservation introuvable." };
    }

    const [customer, vehicle, agency, options, contractFields] =
      await Promise.all([
        deps.customerRepository.findById(booking.customerId),
        deps.vehicleRepository.findById(booking.vehicleId),
        deps.agencyRepository.findById(booking.agencyId),
        deps.optionRepository.listForBooking(booking.id),
        deps.contractFieldsRepository.findByBooking(booking.id),
      ]);

    if (!customer || !vehicle || !agency) {
      return { kind: "error", message: "Données incomplètes." };
    }
    if (!agency.organizationId) {
      return { kind: "error", message: "Organisation introuvable." };
    }

    const logoDataUrl = await fetchImageAsDataUrl(
      agency.logoDarkUrl ?? agency.logoUrl ?? null,
    );

    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const numberOfDays = Math.max(1, computeBilledDays(startDate, endDate));

    const { pricePerDay } = computeContractPricing({
      options,
      numberOfDays,
      bookingTotalPrice: booking.totalPrice,
    });

    const defaults = buildDefaultContractFields({
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        birthDate: customer.birthDate,
        birthPlace: customer.birthPlace,
        address: customer.address,
        postalCode: customer.postalCode,
        city: customer.city,
        country: customer.country,
        phone: customer.phone,
        email: customer.email,
        driverLicenseNumber: customer.driverLicenseNumber,
        driverLicenseIssuedAt: customer.driverLicenseIssuedAt,
      },
      vehicle: {
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        registrationPlate: vehicle.registrationPlate,
        fiscalPower: vehicle.fiscalPower ?? null,
      },
      agency: { city: agency.city },
      startDate,
      endDate,
      numberOfDays,
      pricePerDay,
      totalPrice: booking.totalPrice,
    });

    // Les valeurs sauvegardées l'emportent sur les défauts quand elles sont
    // définies (string non vide OU strictement '' pour effacer un défaut).
    const saved = contractFields?.fields ?? {};
    const merged: ContractEditableFields = { ...defaults, ...saved };

    const pdfData = buildContractPdfData({
      agency,
      customer,
      merged,
      logoDataUrl,
      customerSignature: contractFields?.customerSignature ?? null,
      loueurSignature: contractFields?.loueurSignature ?? null,
    });

    const pdfBuffer = await deps.pdfRenderer.render(pdfData);

    const fileName = `Contrat-${booking.id}.pdf`;
    const filePath = `${agency.organizationId}/${agency.id}/contract/${fileName}`;

    const existingByBooking = await deps.documentRepository.listByBooking(
      booking.id,
    );
    const existing = existingByBooking.find((d) => d.type === "contract");

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

    const created = await deps.documentRepository.create({
      agencyId: agency.id,
      bookingId: booking.id,
      type: "contract",
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

export type GenerateContractUseCase = ReturnType<
  typeof createGenerateContractUseCase
>;
