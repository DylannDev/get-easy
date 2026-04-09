/**
 * Composition root.
 *
 * Single place where concrete adapters from /infrastructure are wired into
 * the ports declared in /domain and the use cases declared in /application.
 * Application use cases consume the resulting `Container` rather than
 * instantiating dependencies themselves.
 */
import {
  createSupabaseVehicleRepository,
  createSupabaseAgencyRepository,
  createSupabaseBookingRepository,
  createSupabaseCustomerRepository,
  createSupabasePaymentRepository,
} from "@/infrastructure/supabase/repositories";
import { createStripePaymentGateway } from "@/infrastructure/stripe";
import { createResendNotifier } from "@/infrastructure/resend";

import type { VehicleRepository } from "@/domain/vehicle";
import type { AgencyRepository } from "@/domain/agency";
import type { BookingRepository } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { PaymentRepository, PaymentGateway } from "@/domain/payment";
import type { Notifier } from "@/application/notifications/notification.port";

import {
  createInitiateBookingUseCase,
  type InitiateBookingUseCase,
} from "@/application/booking/initiate-booking.use-case";
import {
  createStartCheckoutUseCase,
  type StartCheckoutUseCase,
} from "@/application/booking/start-checkout.use-case";
import {
  createConfirmBookingPaymentUseCase,
  type ConfirmBookingPaymentUseCase,
} from "@/application/booking/confirm-booking-payment.use-case";
import {
  createHandlePaymentFailedUseCase,
  type HandlePaymentFailedUseCase,
} from "@/application/booking/handle-payment-failed.use-case";
import {
  createRecordRefundedChargeUseCase,
  type RecordRefundedChargeUseCase,
} from "@/application/booking/record-refunded-charge.use-case";
import {
  createVerifyCheckoutSessionUseCase,
  type VerifyCheckoutSessionUseCase,
} from "@/application/booking/verify-checkout-session.use-case";

export interface Container {
  // Repositories
  vehicleRepository: VehicleRepository;
  agencyRepository: AgencyRepository;
  bookingRepository: BookingRepository;
  customerRepository: CustomerRepository;
  paymentRepository: PaymentRepository;

  // Adapters
  paymentGateway: PaymentGateway;
  notifier: Notifier;

  // Use cases
  initiateBookingUseCase: InitiateBookingUseCase;
  startCheckoutUseCase: StartCheckoutUseCase;
  confirmBookingPaymentUseCase: ConfirmBookingPaymentUseCase;
  handlePaymentFailedUseCase: HandlePaymentFailedUseCase;
  recordRefundedChargeUseCase: RecordRefundedChargeUseCase;
  verifyCheckoutSessionUseCase: VerifyCheckoutSessionUseCase;
}

let cachedContainer: Container | null = null;

export const getContainer = (): Container => {
  if (cachedContainer) return cachedContainer;

  // Repositories
  const vehicleRepository = createSupabaseVehicleRepository();
  const agencyRepository = createSupabaseAgencyRepository();
  const bookingRepository = createSupabaseBookingRepository();
  const customerRepository = createSupabaseCustomerRepository();
  const paymentRepository = createSupabasePaymentRepository();

  // Adapters — env access happens here, in the composition root.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable");
  }
  const paymentGateway = createStripePaymentGateway({ webhookSecret });
  const notifier = createResendNotifier();

  const adminEmail = process.env.ADMIN_EMAIL || "contact@geteasylocation.com";

  // Use cases
  const initiateBookingUseCase = createInitiateBookingUseCase({
    vehicleRepository,
    bookingRepository,
  });
  const startCheckoutUseCase = createStartCheckoutUseCase({
    customerRepository,
    bookingRepository,
    paymentRepository,
    paymentGateway,
  });
  const confirmBookingPaymentUseCase = createConfirmBookingPaymentUseCase({
    bookingRepository,
    paymentRepository,
    customerRepository,
    vehicleRepository,
    paymentGateway,
    notifier,
    adminEmail,
  });
  const handlePaymentFailedUseCase = createHandlePaymentFailedUseCase({
    bookingRepository,
    paymentRepository,
    paymentGateway,
  });
  const recordRefundedChargeUseCase = createRecordRefundedChargeUseCase({
    bookingRepository,
    paymentRepository,
  });
  const verifyCheckoutSessionUseCase = createVerifyCheckoutSessionUseCase({
    bookingRepository,
    paymentRepository,
    // The Stripe adapter implements both PaymentGateway and
    // CheckoutSessionMetadataReader.
    metadataReader: paymentGateway,
  });

  cachedContainer = {
    vehicleRepository,
    agencyRepository,
    bookingRepository,
    customerRepository,
    paymentRepository,
    paymentGateway,
    notifier,
    initiateBookingUseCase,
    startCheckoutUseCase,
    confirmBookingPaymentUseCase,
    handlePaymentFailedUseCase,
    recordRefundedChargeUseCase,
    verifyCheckoutSessionUseCase,
  };
  return cachedContainer;
};
