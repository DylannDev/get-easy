export interface Customer {
  id: string;
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
  /** Champs "professionnel" (B2B). Un client est considéré comme une
   *  entreprise si `companyName` est rempli — pas d'enum discriminant. */
  companyName?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
  createdAt: string;
  userId?: string | null;
}
