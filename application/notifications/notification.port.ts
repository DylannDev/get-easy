/**
 * NotificationPort — abstracts outbound transactional emails (and future
 * channels). The use cases depend on this interface; the Resend adapter
 * lives in `infrastructure/resend/`.
 *
 * Notification *content* is a presentation concern (the React Email templates
 * live in `/emails`), but *triggering* notifications is an application
 * concern, which is why the port lives here rather than in the domain layer.
 */

export interface BookingOptionSummary {
  name: string;
  quantity: number;
}

export interface BookingPaidClientNotification {
  to: string;
  firstName: string;
  lastName: string;
  email: string;
  startDate: string; // formatted, human-readable
  startTime: string; // e.g. "10h00"
  endDate: string;
  endTime: string;
  totalPrice: number;
  vehicle: { brand: string; model: string };
  options?: BookingOptionSummary[];
}

export interface BookingPaidAdminNotification {
  to: string;
  firstName: string;
  lastName: string;
  customerEmail: string;
  customerPhone: string;
  bookingId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  totalPrice: number;
  vehicle: { brand: string; model: string };
  options?: BookingOptionSummary[];
}

export interface BookingRejectedNotification {
  to: string;
  firstName: string;
  lastName: string;
  vehicle: { brand: string; model: string };
  startDate: string;
  endDate: string;
  reason: "unavailable" | "already_paid" | "not_found";
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface BookingDocumentsNotification {
  to: string;
  firstName: string;
  lastName: string;
  vehicle: { brand: string; model: string };
  startDate: string;
  endDate: string;
  attachments: EmailAttachment[];
  /** Liste des libellés des docs joints (pour affichage dans l'email). */
  documentLabels: string[];
}

export interface NotificationResult {
  success: boolean;
  error?: string;
}

export interface Notifier {
  sendBookingPaidToClient(
    payload: BookingPaidClientNotification
  ): Promise<NotificationResult>;

  sendBookingPaidToAdmin(
    payload: BookingPaidAdminNotification
  ): Promise<NotificationResult>;

  sendBookingRejected(
    payload: BookingRejectedNotification
  ): Promise<NotificationResult>;

  sendBookingDocumentsToClient(
    payload: BookingDocumentsNotification
  ): Promise<NotificationResult>;
}
