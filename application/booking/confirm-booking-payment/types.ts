export interface ConfirmBookingPaymentInput {
  bookingId: string;
  paymentId: string;
  stripePaymentIntentId: string | null;
}

export type ConfirmBookingPaymentOutcome =
  | { kind: "approved" }
  | { kind: "rejected_not_found" }
  | { kind: "rejected_already_paid" }
  | { kind: "rejected_dates_taken" }
  | { kind: "error"; message: string };

/** Signature de l'envoi de SMS admin lors d'une réservation payée. Le hook
 *  est optionnel — l'agence peut désactiver les SMS dans ses paramètres. */
export interface SendAdminSmsParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleName: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  totalPrice: number;
  agencyId: string;
  options?: { name: string; quantity: number }[];
}
