import type { CustomerDocumentType } from "@/domain/customer-document";

/** Pièce jointe en staging à finaliser après création/mise à jour de la
 *  réservation (le fichier est déjà sur Storage à `staging/{key}`). */
export interface StagedDocumentInput {
  stagingKey: string;
  type: CustomerDocumentType;
  fileName: string;
  mimeType: string;
  size: number;
}

/** Forme du client telle que postée par le wizard admin (mêmes champs que
 *  le formulaire public mais saisis par la gérante). */
export interface ManualBookingCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthPlace?: string | null;
  address: string;
  address2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  driverLicenseNumber?: string | null;
  driverLicenseIssuedAt?: string | null;
  driverLicenseCountry?: string | null;
  companyName?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
}

export interface SelectedOptionInput {
  optionId: string;
  quantity: number;
}
