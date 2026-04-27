/**
 * Forme normalisée des champs client utilisés à la fois par
 * `customer-edit-form` et l'étape 3 du wizard de création de réservation.
 * Toutes les valeurs sont des `string` (jamais `null`/`undefined`) — les
 * conversions vers/depuis le format BDD se font côté caller.
 */
export interface CustomerFieldsValue {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthPlace: string;
  address: string;
  address2: string;
  postalCode: string;
  city: string;
  country: string;
  driverLicenseNumber: string;
  driverLicenseIssuedAt: string;
  driverLicenseCountry: string;
}

export interface BusinessFieldsValue {
  companyName: string;
  siret: string;
  vatNumber: string;
}

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;
export type CountryOption = { value: string; label: string };
export type Errors = Record<string, string | undefined>;
