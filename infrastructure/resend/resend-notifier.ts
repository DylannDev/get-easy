import type {
  Notifier,
  BookingPaidClientNotification,
  BookingPaidAdminNotification,
  BookingRejectedNotification,
  NotificationResult,
} from "@/application/notifications/notification.port";
import { BookingPaidClientEmail } from "@/emails/BookingPaidClientEmail";
import { BookingPaidAdminEmail } from "@/emails/BookingPaidAdminEmail";
import { BookingRejectedEmail } from "@/emails/BookingRejectedEmail";
import { resend } from "./resend.client";

const FROM_ADDRESS = "Get Easy <noreply@geteasylocation.com>";

/**
 * Resend adapter implementing the application `Notifier` port.
 *
 * Owns the React Email templates wiring and the Resend SDK call. Errors
 * are caught and returned as `NotificationResult` so callers (use cases)
 * can decide whether to abort or continue — sending an email never
 * throws out of this adapter.
 */
export const createResendNotifier = (): Notifier => {
  const sendBookingPaidToClient = async (
    payload: BookingPaidClientNotification
  ): Promise<NotificationResult> => {
    try {
      const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: payload.to,
        subject: `Confirmation de réservation - ${payload.vehicle.brand} ${payload.vehicle.model}`,
        react: BookingPaidClientEmail({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          startDate: payload.startDate,
          startTime: payload.startTime,
          endDate: payload.endDate,
          endTime: payload.endTime,
          totalPrice: payload.totalPrice,
          vehicle: payload.vehicle,
        }),
      });
      if (error) {
        console.error("❌ Erreur lors de l'envoi de l'email client:", error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      console.error("❌ Erreur inattendue (email client):", e);
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erreur inconnue",
      };
    }
  };

  const sendBookingPaidToAdmin = async (
    payload: BookingPaidAdminNotification
  ): Promise<NotificationResult> => {
    try {
      const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: payload.to,
        subject: `Nouvelle réservation - ${payload.vehicle.brand} ${payload.vehicle.model}`,
        react: BookingPaidAdminEmail({
          firstName: payload.firstName,
          lastName: payload.lastName,
          customerEmail: payload.customerEmail,
          phone: payload.customerPhone,
          startDate: payload.startDate,
          startTime: payload.startTime,
          endDate: payload.endDate,
          endTime: payload.endTime,
          totalPrice: payload.totalPrice,
          vehicle: payload.vehicle,
        }),
      });
      if (error) {
        console.error("❌ Erreur lors de l'envoi de l'email admin:", error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      console.error("❌ Erreur inattendue (email admin):", e);
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erreur inconnue",
      };
    }
  };

  const sendBookingRejected = async (
    payload: BookingRejectedNotification
  ): Promise<NotificationResult> => {
    try {
      const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: payload.to,
        subject: `Paiement non validé - ${payload.vehicle.brand} ${payload.vehicle.model}`,
        react: BookingRejectedEmail({
          firstName: payload.firstName,
          lastName: payload.lastName,
          vehicle: payload.vehicle,
          startDate: payload.startDate,
          endDate: payload.endDate,
          reason: payload.reason,
        }),
      });
      if (error) {
        console.error("❌ Erreur lors de l'envoi de l'email de rejet:", error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      console.error("❌ Erreur inattendue (email rejet):", e);
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erreur inconnue",
      };
    }
  };

  return {
    sendBookingPaidToClient,
    sendBookingPaidToAdmin,
    sendBookingRejected,
  };
};
