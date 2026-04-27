import type { Agency } from "@/domain/agency";
import type { Customer } from "@/domain/customer";
import type { ContractEditableFields } from "@/domain/contract";
import { getCountryName } from "@/lib/countries";
import type { ContractPdfData } from "./types";

interface Args {
  agency: Agency;
  customer: Customer;
  merged: ContractEditableFields;
  logoDataUrl: string | null;
  customerSignature: string | null;
  loueurSignature: string | null;
}

/**
 * Assemble le payload final passé au renderer PDF, à partir :
 *  - de l'agence (lecture seule, jamais éditable)
 *  - du client en BDD pour les champs B2B (companyName/siret/vatNumber)
 *  - des champs éditables fusionnés (defaults + valeurs sauvegardées admin)
 *  - du logo en data URL (chargé en amont) et des deux signatures
 */
export function buildContractPdfData({
  agency,
  customer,
  merged,
  logoDataUrl,
  customerSignature,
  loueurSignature,
}: Args): ContractPdfData {
  return {
    generatedAt: new Date(),
    agency: {
      name: agency.name,
      legalForm: agency.legalForm ?? null,
      capitalSocial: agency.capitalSocial ?? null,
      address: agency.address,
      postalCode: agency.postalCode ?? null,
      city: agency.city,
      country: agency.country
        ? (getCountryName(agency.country) ?? agency.country)
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
      companyName: customer.companyName,
      siret: customer.siret,
      vatNumber: customer.vatNumber,
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
    customerSignature,
    loueurSignature,
  };
}
