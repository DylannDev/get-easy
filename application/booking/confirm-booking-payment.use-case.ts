import type { BookingRepository } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type { OptionRepository } from "@/domain/option";
import type { PaymentGateway, PaymentRepository } from "@/domain/payment";
import { BookingStatus } from "@/domain/booking";
import { PaymentStatus } from "@/domain/payment";
import type { Notifier } from "../notifications/notification.port";
import type {
  ConfirmBookingPaymentInput,
  ConfirmBookingPaymentOutcome,
  SendAdminSmsParams,
} from "./confirm-booking-payment/types";
import { hasPaidConflict } from "./confirm-booking-payment/check-conflict";
import {
  notifyRejected,
  refundSafe,
} from "./confirm-booking-payment/refund-helpers";
import { notifyBookingPaid } from "./confirm-booking-payment/notify-success";

// Re-exports historiques.
export type {
  ConfirmBookingPaymentInput,
  ConfirmBookingPaymentOutcome,
} from "./confirm-booking-payment/types";

interface ConfirmBookingPaymentDeps {
  bookingRepository: BookingRepository;
  paymentRepository: PaymentRepository;
  customerRepository: CustomerRepository;
  vehicleRepository: VehicleRepository;
  optionRepository: OptionRepository;
  paymentGateway: PaymentGateway;
  notifier: Notifier;
  adminEmail: string;
  /**
   * Optional — appelé en fire-and-forget une fois le booking passé en
   * `paid` pour générer et stocker la facture PDF. Les erreurs sont
   * silencieuses (loggées) pour ne pas interrompre le flow webhook. */
  generateInvoice?: (bookingId: string) => Promise<unknown>;
  /** Optional — envoie un SMS à l'admin quand une réservation est payée. */
  sendAdminSms?: (params: SendAdminSmsParams) => Promise<void>;
}

/**
 * Gère le branchement `checkout.session.completed` du webhook Stripe.
 *
 * Validation rules (preserved exactly):
 *  V1. Booking must still exist.
 *  V2. Booking must not already be `paid` (otherwise refund as duplicate).
 *  V3. No other `paid` booking may overlap the dates (race-condition guard).
 *
 * On rejection: marks payment/booking as refunded, refunds via the gateway,
 * and notifies the customer with the appropriate reason.
 */
export const createConfirmBookingPaymentUseCase = (
  deps: ConfirmBookingPaymentDeps,
) => {
  const execute = async (
    input: ConfirmBookingPaymentInput,
  ): Promise<ConfirmBookingPaymentOutcome> => {
    // V1 — booking exists
    const booking = await deps.bookingRepository.findById(input.bookingId);
    if (!booking) {
      await deps.paymentRepository.update(input.paymentId, {
        status: PaymentStatus.Refunded,
      });
      await refundSafe(
        deps.paymentGateway,
        input.stripePaymentIntentId,
        "requested_by_customer",
      );
      return { kind: "rejected_not_found" };
    }

    // V2 — not already paid
    if (booking.status === BookingStatus.Paid) {
      await deps.paymentRepository.update(input.paymentId, {
        status: PaymentStatus.Refunded,
      });
      await notifyRejected({
        customerRepository: deps.customerRepository,
        vehicleRepository: deps.vehicleRepository,
        notifier: deps.notifier,
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        reason: "already_paid",
      });
      await refundSafe(
        deps.paymentGateway,
        input.stripePaymentIntentId,
        "duplicate",
      );
      return { kind: "rejected_already_paid" };
    }

    // V3 — no paid conflict
    const conflict = await hasPaidConflict({
      bookingRepository: deps.bookingRepository,
      bookingId: booking.id,
      vehicleId: booking.vehicleId,
      startDate: new Date(booking.startDate),
      endDate: new Date(booking.endDate),
    });
    if (conflict) {
      await deps.bookingRepository.update(booking.id, {
        status: BookingStatus.Refunded,
      });
      await deps.paymentRepository.update(input.paymentId, {
        status: PaymentStatus.Refunded,
      });
      await notifyRejected({
        customerRepository: deps.customerRepository,
        vehicleRepository: deps.vehicleRepository,
        notifier: deps.notifier,
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        reason: "unavailable",
      });
      await refundSafe(
        deps.paymentGateway,
        input.stripePaymentIntentId,
        "requested_by_customer",
      );
      return { kind: "rejected_dates_taken" };
    }

    // ✅ Approve
    await deps.paymentRepository.update(input.paymentId, {
      status: PaymentStatus.Succeeded,
      stripePaymentIntentId: input.stripePaymentIntentId,
    });
    await deps.bookingRepository.update(booking.id, {
      status: BookingStatus.Paid,
    });

    // Génération de la facture en fire-and-forget — on ne bloque pas le
    // webhook si la création échoue, on log simplement l'erreur.
    if (deps.generateInvoice) {
      try {
        await deps.generateInvoice(booking.id);
      } catch (e) {
        console.error("❌ Invoice generation failed:", e);
      }
    }

    // Notifications client + admin (emails + SMS optionnel).
    await notifyBookingPaid({
      customerRepository: deps.customerRepository,
      vehicleRepository: deps.vehicleRepository,
      optionRepository: deps.optionRepository,
      notifier: deps.notifier,
      adminEmail: deps.adminEmail,
      sendAdminSms: deps.sendAdminSms,
      booking,
    });

    return { kind: "approved" };
  };

  return { execute };
};

export type ConfirmBookingPaymentUseCase = ReturnType<
  typeof createConfirmBookingPaymentUseCase
>;
