/**
 * Customer fields (camelCase) consumed by the use case.
 * Mirrors the shape produced by the booking form (Zod schema).
 */
export interface CheckoutCustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string; // "JJ/MM/AAAA"
  birthPlace?: string | null;
  address: string;
  address2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  driverLicenseNumber?: string | null;
  driverLicenseIssuedAt?: string | null; // "JJ/MM/AAAA"
  driverLicenseCountry?: string | null;
  /** Champs pro (B2B) — fournis si "Je suis un professionnel" coché. */
  isBusiness?: boolean;
  companyName?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
}

export interface SelectedOptionInput {
  optionId: string;
  quantity: number;
}

export interface StartCheckoutInput {
  customerData: CheckoutCustomerData;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  agencyId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  /** Options selected by the customer. Empty if none. */
  selectedOptions?: SelectedOptionInput[];
  /** Booking id from the `initiated` step (optional). */
  bookingId?: string;
  /** Origin URL used to build success/cancel redirect URLs. */
  origin: string;
}

export interface StartCheckoutOutput {
  success: boolean;
  customerId?: string;
  bookingId?: string;
  checkoutUrl?: string;
  error?: string;
}

/** TTL avant qu'une réservation `pending_payment` expire automatiquement
 *  (10 minutes — aligné avec la durée de vie d'une session Stripe Checkout). */
export const PENDING_PAYMENT_TTL_MS = 10 * 60 * 1000;
