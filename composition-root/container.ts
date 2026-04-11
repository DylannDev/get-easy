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
import {
  createGetDashboardSummaryUseCase,
  type GetDashboardSummaryUseCase,
} from "@/application/admin/get-dashboard-summary.use-case";
import {
  createGetPlanningDataUseCase,
  type GetPlanningDataUseCase,
} from "@/application/admin/get-planning-data.use-case";
import {
  createGetStatisticsUseCase,
  type GetStatisticsUseCase,
} from "@/application/admin/get-statistics.use-case";

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
  getDashboardSummaryUseCase: GetDashboardSummaryUseCase;
  getPlanningDataUseCase: GetPlanningDataUseCase;
  getStatisticsUseCase: GetStatisticsUseCase;
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

  const getDashboardSummaryUseCase = createGetDashboardSummaryUseCase({
    bookingRepository,
  });

  const getPlanningDataUseCase = createGetPlanningDataUseCase({
    vehicleRepository,
    bookingRepository,
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
    getDashboardSummaryUseCase,
    getPlanningDataUseCase,
    getStatisticsUseCase: createGetStatisticsUseCase({
      bookingRepository,
      vehicleRepository,
    }),
  };
  return cachedContainer;
};
