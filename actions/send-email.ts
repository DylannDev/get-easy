"use server";

import { resend } from "@/lib/resend";
import { BookingPaidClientEmail } from "@/emails/BookingPaidClientEmail";
import { BookingPaidAdminEmail } from "@/emails/BookingPaidAdminEmail";
import { BookingRejectedEmail } from "@/emails/BookingRejectedEmail";

interface SendBookingPaidClientEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  email: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  vehicle: {
    brand: string;
    model: string;
  };
}

interface SendBookingPaidAdminEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  customerEmail: string;
  bookingId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  vehicle: {
    brand: string;
    model: string;
  };
}

interface SendBookingRejectedEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  vehicle: {
    brand: string;
    model: string;
  };
  startDate: string;
  endDate: string;
  reason: "unavailable" | "already_paid" | "not_found";
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Envoie un email de confirmation au client après un paiement réussi
 */
export async function sendBookingPaidClientEmail(
  params: SendBookingPaidClientEmailParams
): Promise<SendEmailResult> {
  try {
    const {
      to,
      firstName,
      lastName,
      email,
      startDate,
      endDate,
      totalPrice,
      vehicle,
    } = params;

    const { data, error } = await resend.emails.send({
      from: "Get Easy <noreply@geteasylocation.com>",
      to: to,
      subject: `Confirmation de réservation - ${vehicle.brand} ${vehicle.model}`,
      react: BookingPaidClientEmail({
        firstName,
        lastName,
        email,
        startDate,
        endDate,
        totalPrice,
        vehicle,
      }),
    });

    if (error) {
      console.error("❌ Erreur lors de l'envoi de l'email client:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log("✅ Email de confirmation envoyé au client:", data?.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "❌ Erreur inattendue lors de l'envoi de l'email client:",
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Envoie un email de notification à l'administrateur de l'agence après un paiement réussi
 */
export async function sendBookingPaidAdminEmail(
  params: SendBookingPaidAdminEmailParams
): Promise<SendEmailResult> {
  try {
    const {
      firstName,
      lastName,
      customerEmail,
      startDate,
      endDate,
      totalPrice,
      vehicle,
    } = params;

    const { data, error } = await resend.emails.send({
      from: "Get Easy <noreply@geteasylocation.com>",
      to: "contact@geteasylocation.com",
      subject: `Nouvelle réservation - ${vehicle.brand} ${vehicle.model}`,
      react: BookingPaidAdminEmail({
        firstName,
        lastName,
        customerEmail,
        startDate,
        endDate,
        totalPrice,
        vehicle,
      }),
    });

    if (error) {
      console.error("❌ Erreur lors de l'envoi de l'email admin:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log("✅ Email de notification envoyé à l'admin:", data?.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "❌ Erreur inattendue lors de l'envoi de l'email admin:",
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Envoie un email au client lorsque son paiement ne peut pas être validé
 */
export async function sendBookingRejectedEmail(
  params: SendBookingRejectedEmailParams
): Promise<SendEmailResult> {
  try {
    const { to, firstName, lastName, vehicle, startDate, endDate, reason } =
      params;

    const { data, error } = await resend.emails.send({
      from: "Get Easy <noreply@geteasylocation.com>",
      to: to,
      subject: `Paiement non validé - ${vehicle.brand} ${vehicle.model}`,
      react: BookingRejectedEmail({
        firstName,
        lastName,
        vehicle,
        startDate,
        endDate,
        reason,
      }),
    });

    if (error) {
      console.error("❌ Erreur lors de l'envoi de l'email de rejet:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log("✅ Email de rejet envoyé au client:", data?.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "❌ Erreur inattendue lors de l'envoi de l'email de rejet:",
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
