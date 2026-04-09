import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { BookingRepository } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type {
  PaymentRepository,
  PaymentGateway,
} from "@/domain/payment";
import { PaymentStatus } from "@/domain/payment";
import { BookingStatus } from "@/domain/booking";
import type { Notifier } from "../notifications/notification.port";

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

interface ConfirmBookingPaymentDeps {
  bookingRepository: BookingRepository;
  paymentRepository: PaymentRepository;
  customerRepository: CustomerRepository;
  vehicleRepository: VehicleRepository;
  paymentGateway: PaymentGateway;
  notifier: Notifier;
  adminEmail: string;
}

/**
 * Replaces the `checkout.session.completed` branch of the Stripe webhook
 * route (~370 lines).
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
  deps: ConfirmBookingPaymentDeps
) => {
  // ----- helpers (closures) -----

  const refundSafe = async (
    intentId: string | null,
    reason: "duplicate" | "requested_by_customer"
  ): Promise<void> => {
    if (!intentId) return;
    try {
      await deps.paymentGateway.refundByIntentId(intentId, reason);
    } catch (e) {
      console.error("❌ Refund failed:", e);
    }
  };

  const notifyRejected = async (
    customerId: string,
    booking: { vehicleId: string; startDate: string; endDate: string },
    reason: "unavailable" | "already_paid" | "not_found"
  ): Promise<void> => {
    const customer = await deps.customerRepository.findById(customerId);
    const vehicle = await deps.vehicleRepository.findById(booking.vehicleId);
    if (!customer || !vehicle) return;
    await deps.notifier.sendBookingRejected({
      to: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      vehicle: { brand: vehicle.brand, model: vehicle.model },
      startDate: format(new Date(booking.startDate), "dd MMMM yyyy", {
        locale: fr,
      }),
      endDate: format(new Date(booking.endDate), "dd MMMM yyyy", {
        locale: fr,
      }),
      reason,
    });
  };

  // ----- public API -----

  const execute = async (
    input: ConfirmBookingPaymentInput
  ): Promise<ConfirmBookingPaymentOutcome> => {
    // V1 — booking exists
    const booking = await deps.bookingRepository.findById(input.bookingId);
    if (!booking) {
      await deps.paymentRepository.update(input.paymentId, {
        status: PaymentStatus.Refunded,
      });
      await refundSafe(input.stripePaymentIntentId, "requested_by_customer");
      return { kind: "rejected_not_found" };
    }

    // V2 — not already paid
    if (booking.status === BookingStatus.Paid) {
      await deps.paymentRepository.update(input.paymentId, {
        status: PaymentStatus.Refunded,
      });
      await notifyRejected(booking.customerId, booking, "already_paid");
      await refundSafe(input.stripePaymentIntentId, "duplicate");
      return { kind: "rejected_already_paid" };
    }

    // V3 — no paid conflict
    const conflicts = await deps.bookingRepository.findPaidConflicts({
      vehicleId: booking.vehicleId,
      startDate: new Date(booking.startDate),
      endDate: new Date(booking.endDate),
      excludeBookingId: booking.id,
    });

    // Re-apply day-level overlap (the SQL query is a coarse filter)
    const start = new Date(booking.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(booking.endDate);
    end.setHours(0, 0, 0, 0);

    const hasConflict = conflicts.some((other) => {
      const oStart = new Date(other.start_date);
      oStart.setHours(0, 0, 0, 0);
      const oEnd = new Date(other.end_date);
      oEnd.setHours(0, 0, 0, 0);
      return start <= oEnd && end >= oStart;
    });

    if (hasConflict) {
      await deps.bookingRepository.update(booking.id, {
        status: BookingStatus.Refunded,
      });
      await deps.paymentRepository.update(input.paymentId, {
        status: PaymentStatus.Refunded,
      });
      await notifyRejected(booking.customerId, booking, "unavailable");
      await refundSafe(input.stripePaymentIntentId, "requested_by_customer");
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

    // Notifications (failures are logged but do not abort the flow)
    const customer = await deps.customerRepository.findById(booking.customerId);
    const vehicle = await deps.vehicleRepository.findById(booking.vehicleId);

    if (customer && vehicle) {
      const startFormatted = format(
        new Date(booking.startDate),
        "dd MMMM yyyy",
        { locale: fr }
      );
      const startTimeFormatted = format(new Date(booking.startDate), "HH'h'mm");
      const endFormatted = format(new Date(booking.endDate), "dd MMMM yyyy", {
        locale: fr,
      });
      const endTimeFormatted = format(new Date(booking.endDate), "HH'h'mm");

      await deps.notifier.sendBookingPaidToClient({
        to: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        startDate: startFormatted,
        startTime: startTimeFormatted,
        endDate: endFormatted,
        endTime: endTimeFormatted,
        totalPrice: booking.totalPrice,
        vehicle: { brand: vehicle.brand, model: vehicle.model },
      });

      await deps.notifier.sendBookingPaidToAdmin({
        to: deps.adminEmail,
        firstName: customer.firstName,
        lastName: customer.lastName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        bookingId: booking.id,
        startDate: startFormatted,
        startTime: startTimeFormatted,
        endDate: endFormatted,
        endTime: endTimeFormatted,
        totalPrice: booking.totalPrice,
        vehicle: { brand: vehicle.brand, model: vehicle.model },
      });
    }

    return { kind: "approved" };
  };

  return { execute };
};

export type ConfirmBookingPaymentUseCase = ReturnType<
  typeof createConfirmBookingPaymentUseCase
>;
