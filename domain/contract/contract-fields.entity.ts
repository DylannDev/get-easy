/**
 * Valeurs éditables par la gérante dans l'éditeur de contrat de location.
 *
 * Tous les champs sont des strings (le formulaire les manipule comme tel et
 * le PDF les rend directement). Les champs "snapshot" côté agence ne sont
 * PAS ici — ils sont relus à chaque génération depuis l'agence et ne
 * peuvent pas être modifiés dans l'éditeur de contrat.
 */
export interface ContractEditableFields {
  // Locataire
  customerFirstName?: string;
  customerLastName?: string;
  customerBirthDate?: string; // libre, affiché tel quel
  customerBirthPlace?: string;
  customerIdNumber?: string;
  customerIdIssuedAt?: string;
  customerLicenseNumber?: string;
  customerLicenseIssuedAt?: string;
  customerLicenseValidUntil?: string;
  customerAddress?: string;
  customerPostalCode?: string;
  customerCity?: string;
  customerCountry?: string; // libellé en clair (pas le code ISO)
  customerPhone?: string;
  customerEmail?: string;

  // Véhicule
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleFiscalPower?: string;
  vehicleColor?: string;
  vehicleRegistrationPlate?: string;
  vehicleMileageStart?: string;
  vehicleMileageEnd?: string;
  vehicleFuelStart?: string;
  vehicleFuelEnd?: string;

  // Durée / montants
  durationLabel?: string; // "5 jours"
  rentalStart?: string; // "10 avril 2026 à 09h00"
  rentalEnd?: string;
  pricePerDay?: string; // "45,00 €"
  priceTotal?: string;

  // Divers
  constatDate?: string;
  returnAddress?: string;
  returnDatetime?: string;
  contractCity?: string;
  contractDate?: string;
}

export interface BookingContractFields {
  bookingId: string;
  fields: ContractEditableFields;
  /** PNG base64 ou data URL. */
  customerSignature: string | null;
  loueurSignature: string | null;
  signedAt: string | null;
  updatedAt: string;
}
