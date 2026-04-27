import type { Document } from "@/domain/document";

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
    companyName?: string | null;
    siret?: string | null;
    vatNumber?: string | null;
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

export type GenerateContractOutcome =
  | { kind: "created"; document: Document }
  | { kind: "regenerated"; document: Document }
  | { kind: "error"; message: string };
