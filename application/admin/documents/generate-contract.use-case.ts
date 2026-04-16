import type { AgencyRepository } from "@/domain/agency";
import type { BookingRepository } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type { DocumentRepository, Document } from "@/domain/document";
import type { OptionRepository } from "@/domain/option";
import type {
  ContractFieldsRepository,
  ContractEditableFields,
} from "@/domain/contract";
import { computeBilledDays } from "@/domain/vehicle";
import { getCountryName } from "@/lib/countries";
import { fetchImageAsDataUrl } from "@/lib/pdf/fetch-image-as-data-url";

/**
 * Données passées au renderer PDF du contrat. Shape identique à
 * `ContractData` dans `lib/pdf/contract-template.tsx`, redéclarée ici pour
 * conserver la frontière application / framework PDF.
 */
export interface ContractPdfData {
  generatedAt: Date;
  agency: {
    name: string;
    legalForm?: string | null;
    capitalSocial?: string | null;
    address: string;
    postalCode?: string | null;
    city: string;
    country?: string | null;
    rcsCity?: string | null;
    rcsNumber?: string | null;
    siret?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
  };
  customer: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    birthPlace?: string;
    idNumber?: string;
    idIssuedAt?: string;
    licenseNumber?: string;
    licenseIssuedAt?: string;
    licenseValidUntil?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
  };
  vehicle: {
    brand?: string;
    model?: string;
    color?: string;
    registrationPlate?: string;
    fiscalPower?: string;
    mileageStart?: string;
    mileageEnd?: string;
    fuelStart?: string;
    fuelEnd?: string;
  };
  rental: {
    durationLabel?: string;
    start?: string;
    end?: string;
    pricePerDay?: string;
    priceTotal?: string;
    returnAddress?: string;
    returnDatetime?: string;
    constatDate?: string;
    contractCity?: string;
    contractDate?: string;
  };
  customerSignature?: string | null;
  loueurSignature?: string | null;
}

export interface ContractPdfRenderer {
  render(data: ContractPdfData): Promise<Buffer>;
}

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

export type GenerateContractOutcome =
  | { kind: "created"; document: Document }
  | { kind: "regenerated"; document: Document }
  | { kind: "error"; message: string };

function formatEurMoney(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

function formatLongDateTime(d: Date): string {
  return `${d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })} à ${d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/**
 * Construit la source "défaut" utilisée quand aucune valeur éditée n'est
 * encore stockée — à partir de la réservation / client / véhicule actuels.
 */
export function buildDefaultContractFields(args: {
  customer: {
    firstName: string;
    lastName: string;
    birthDate: string;
    birthPlace?: string | null;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    driverLicenseNumber?: string | null;
    driverLicenseIssuedAt?: string | null;
  };
  vehicle: {
    brand: string;
    model: string;
    color: string;
    registrationPlate: string;
    fiscalPower?: number | null;
  };
  agency: { city: string };
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  pricePerDay: number;
  totalPrice: number;
}): ContractEditableFields {
  const { customer, vehicle, agency } = args;
  return {
    customerFirstName: customer.firstName,
    customerLastName: customer.lastName,
    customerBirthDate: customer.birthDate,
    customerBirthPlace: customer.birthPlace ?? "",
    customerLicenseNumber: customer.driverLicenseNumber ?? "",
    customerLicenseIssuedAt: customer.driverLicenseIssuedAt ?? "",
    customerAddress: customer.address,
    customerPostalCode: customer.postalCode,
    customerCity: customer.city,
    customerCountry: getCountryName(customer.country) ?? customer.country,
    customerPhone: customer.phone,
    customerEmail: customer.email,

    vehicleBrand: vehicle.brand,
    vehicleModel: vehicle.model,
    vehicleColor: vehicle.color,
    vehicleRegistrationPlate: vehicle.registrationPlate,
    vehicleFiscalPower:
      vehicle.fiscalPower !== null && vehicle.fiscalPower !== undefined
        ? String(vehicle.fiscalPower)
        : "",

    durationLabel: `${args.numberOfDays} jour${args.numberOfDays > 1 ? "s" : ""}`,
    rentalStart: formatLongDateTime(args.startDate),
    rentalEnd: formatLongDateTime(args.endDate),
    pricePerDay: formatEurMoney(args.pricePerDay),
    priceTotal: formatEurMoney(args.totalPrice),

    returnDatetime: formatLongDateTime(args.endDate),
    contractCity: agency.city,
    contractDate: new Date().toLocaleDateString("fr-FR"),
  };
}

/**
 * Génère ou régénère le PDF du contrat à partir :
 *  - des infos loueur (toujours relues depuis l'agence — jamais stockées
 *    dans les champs éditables)
 *  - des champs sauvegardés dans `booking_contract_fields` (éditeur admin)
 *  - des signatures sauvegardées (embarquées comme images dans le PDF)
 *
 * Si aucun champ n'est encore sauvegardé, on remplit depuis la réservation.
 */
export const createGenerateContractUseCase = (deps: Deps) => {
  const execute = async (
    bookingId: string
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
      agency.logoDarkUrl ?? agency.logoUrl ?? null
    );

    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const numberOfDays = Math.max(1, computeBilledDays(startDate, endDate));

    const optionsTotalSnapshot = options.reduce((acc, bo) => {
      const line =
        bo.priceTypeSnapshot === "per_day"
          ? bo.unitPriceSnapshot * bo.quantity * numberOfDays
          : bo.unitPriceSnapshot * bo.quantity;
      return acc + line;
    }, 0);
    const vehicleTotal = Math.max(0, booking.totalPrice - optionsTotalSnapshot);
    const pricePerDay = vehicleTotal / numberOfDays;

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

    const pdfData: ContractPdfData = {
      generatedAt: new Date(),
      agency: {
        name: agency.name,
        legalForm: agency.legalForm ?? null,
        capitalSocial: agency.capitalSocial ?? null,
        address: agency.address,
        postalCode: agency.postalCode ?? null,
        city: agency.city,
        country: agency.country
          ? getCountryName(agency.country) ?? agency.country
          : null,
        rcsCity: agency.rcsCity ?? null,
        rcsNumber: agency.rcsNumber ?? null,
        siret: agency.siret ?? null,
        phone: agency.phone ?? null,
        email: agency.email ?? null,
        logoUrl: logoDataUrl,
      },
      customer: {
        firstName: merged.customerFirstName,
        lastName: merged.customerLastName,
        birthDate: merged.customerBirthDate,
        birthPlace: merged.customerBirthPlace,
        idNumber: merged.customerIdNumber,
        idIssuedAt: merged.customerIdIssuedAt,
        licenseNumber: merged.customerLicenseNumber,
        licenseIssuedAt: merged.customerLicenseIssuedAt,
        licenseValidUntil: merged.customerLicenseValidUntil,
        address: merged.customerAddress,
        postalCode: merged.customerPostalCode,
        city: merged.customerCity,
        country: merged.customerCountry,
        phone: merged.customerPhone,
        email: merged.customerEmail,
      },
      vehicle: {
        brand: merged.vehicleBrand,
        model: merged.vehicleModel,
        color: merged.vehicleColor,
        registrationPlate: merged.vehicleRegistrationPlate,
        fiscalPower: merged.vehicleFiscalPower,
        mileageStart: merged.vehicleMileageStart,
        mileageEnd: merged.vehicleMileageEnd,
        fuelStart: merged.vehicleFuelStart,
        fuelEnd: merged.vehicleFuelEnd,
      },
      rental: {
        durationLabel: merged.durationLabel,
        start: merged.rentalStart,
        end: merged.rentalEnd,
        pricePerDay: merged.pricePerDay,
        priceTotal: merged.priceTotal,
        returnAddress: merged.returnAddress,
        returnDatetime: merged.returnDatetime,
        constatDate: merged.constatDate,
        contractCity: merged.contractCity,
        contractDate: merged.contractDate,
      },
      customerSignature: contractFields?.customerSignature ?? null,
      loueurSignature: contractFields?.loueurSignature ?? null,
    };

    const pdfBuffer = await deps.pdfRenderer.render(pdfData);

    const fileName = `Contrat-${booking.id}.pdf`;
    const filePath = `${agency.organizationId}/${agency.id}/contract/${fileName}`;

    const existingByBooking = await deps.documentRepository.listByBooking(
      booking.id
    );
    const existing = existingByBooking.find((d) => d.type === "contract");

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
