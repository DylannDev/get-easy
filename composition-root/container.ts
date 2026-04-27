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
  createSupabaseOptionRepository,
  createSupabaseDocumentRepository,
  createSupabaseContractFieldsRepository,
  createSupabaseCustomerDocumentRepository,
  createSupabaseQuoteRepository,
  createSupabaseInspectionRepository,
} from "@/infrastructure/supabase/repositories";
import { createStripePaymentGateway } from "@/infrastructure/stripe";
import { createResendNotifier } from "@/infrastructure/resend";

import type { VehicleRepository } from "@/domain/vehicle";
import type { AgencyRepository } from "@/domain/agency";
import type { BookingRepository } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { PaymentRepository, PaymentGateway } from "@/domain/payment";
import type { OptionRepository } from "@/domain/option";
import type { DocumentRepository } from "@/domain/document";
import type { ContractFieldsRepository } from "@/domain/contract";
import type { CustomerDocumentRepository } from "@/domain/customer-document";
import type { QuoteRepository } from "@/domain/quote";
import type { InspectionRepository } from "@/domain/inspection";
import type { Notifier } from "@/application/notifications/notification.port";

import {
  createListOptionsUseCase,
  type ListOptionsUseCase,
} from "@/application/admin/options/list-options.use-case";
import {
  createCreateOptionUseCase,
  type CreateOptionUseCase,
} from "@/application/admin/options/create-option.use-case";
import {
  createUpdateOptionUseCase,
  type UpdateOptionUseCase,
} from "@/application/admin/options/update-option.use-case";
import {
  createDeleteOptionUseCase,
  type DeleteOptionUseCase,
} from "@/application/admin/options/delete-option.use-case";
import {
  createUpdateAgencyTermsUseCase,
  type UpdateAgencyTermsUseCase,
} from "@/application/admin/update-agency-terms.use-case";
import {
  createUpdateAgencyDetailsUseCase,
  type UpdateAgencyDetailsUseCase,
} from "@/application/admin/update-agency-details.use-case";
import {
  createUploadDocumentUseCase,
  type UploadDocumentUseCase,
} from "@/application/admin/documents/upload-document.use-case";
import {
  createListDocumentsUseCase,
  type ListDocumentsUseCase,
} from "@/application/admin/documents/list-documents.use-case";
import {
  createDeleteDocumentUseCase,
  type DeleteDocumentUseCase,
} from "@/application/admin/documents/delete-document.use-case";
import {
  createGetDocumentSignedUrlUseCase,
  type GetDocumentSignedUrlUseCase,
} from "@/application/admin/documents/get-document-signed-url.use-case";
import {
  createGenerateInvoiceUseCase,
  type GenerateInvoiceUseCase,
} from "@/application/admin/documents/generate-invoice.use-case";
import { createSupabaseInvoiceNumberAllocator } from "@/infrastructure/supabase/services/invoice-number-allocator";
import { createSupabaseQuoteNumberAllocator } from "@/infrastructure/supabase/services/quote-number-allocator";
import { createReactPdfInvoiceRenderer } from "@/infrastructure/pdf/invoice-pdf-renderer";
import { createReactPdfQuoteRenderer } from "@/infrastructure/pdf/quote-pdf-renderer";
import { createReactPdfInspectionRenderer } from "@/infrastructure/pdf/inspection-pdf-renderer";
import {
  createGenerateQuoteUseCase,
  type GenerateQuoteUseCase,
} from "@/application/admin/documents/generate-quote.use-case";
import {
  createGenerateInspectionUseCase,
  type GenerateInspectionUseCase,
} from "@/application/admin/documents/generate-inspection.use-case";
import {
  createSendBookingDocumentsUseCase,
  type SendBookingDocumentsUseCase,
} from "@/application/admin/documents/send-booking-documents.use-case";
import {
  createDeleteBookingUseCase,
  type DeleteBookingUseCase,
} from "@/application/admin/delete-booking.use-case";
import {
  createDeleteCustomerUseCase,
  type DeleteCustomerUseCase,
} from "@/application/admin/delete-customer.use-case";
import {
  createGenerateContractUseCase,
  type GenerateContractUseCase,
} from "@/application/admin/documents/generate-contract.use-case";
import {
  createSaveContractFieldsUseCase,
  type SaveContractFieldsUseCase,
} from "@/application/admin/documents/save-contract-fields.use-case";
import { createReactPdfContractRenderer } from "@/infrastructure/pdf/contract-pdf-renderer";

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
  optionRepository: OptionRepository;
  documentRepository: DocumentRepository;
  contractFieldsRepository: ContractFieldsRepository;
  customerDocumentRepository: CustomerDocumentRepository;
  quoteRepository: QuoteRepository;
  inspectionRepository: InspectionRepository;

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
  getPlanningDataUseCase: GetPlanningDataUseCase;
  getStatisticsUseCase: GetStatisticsUseCase;
  listOptionsUseCase: ListOptionsUseCase;
  createOptionUseCase: CreateOptionUseCase;
  updateOptionUseCase: UpdateOptionUseCase;
  deleteOptionUseCase: DeleteOptionUseCase;
  updateAgencyTermsUseCase: UpdateAgencyTermsUseCase;
  updateAgencyDetailsUseCase: UpdateAgencyDetailsUseCase;
  uploadDocumentUseCase: UploadDocumentUseCase;
  listDocumentsUseCase: ListDocumentsUseCase;
  deleteDocumentUseCase: DeleteDocumentUseCase;
  getDocumentSignedUrlUseCase: GetDocumentSignedUrlUseCase;
  generateInvoiceUseCase: GenerateInvoiceUseCase;
  generateContractUseCase: GenerateContractUseCase;
  saveContractFieldsUseCase: SaveContractFieldsUseCase;
  generateQuoteUseCase: GenerateQuoteUseCase;
  generateInspectionUseCase: GenerateInspectionUseCase;
  sendBookingDocumentsUseCase: SendBookingDocumentsUseCase;
  deleteBookingUseCase: DeleteBookingUseCase;
  deleteCustomerUseCase: DeleteCustomerUseCase;
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
  const optionRepository = createSupabaseOptionRepository();
  const documentRepository = createSupabaseDocumentRepository();
  const contractFieldsRepository = createSupabaseContractFieldsRepository();
  const customerDocumentRepository =
    createSupabaseCustomerDocumentRepository();
  const quoteRepository = createSupabaseQuoteRepository();
  const inspectionRepository = createSupabaseInspectionRepository();

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
    optionRepository,
  });
  const generateInvoiceUseCase = createGenerateInvoiceUseCase({
    bookingRepository,
    customerRepository,
    vehicleRepository,
    agencyRepository,
    optionRepository,
    documentRepository,
    numberAllocator: createSupabaseInvoiceNumberAllocator(),
    pdfRenderer: createReactPdfInvoiceRenderer(),
  });

  const confirmBookingPaymentUseCase = createConfirmBookingPaymentUseCase({
    bookingRepository,
    paymentRepository,
    customerRepository,
    vehicleRepository,
    optionRepository,
    paymentGateway,
    notifier,
    adminEmail,
    generateInvoice: (bookingId) => generateInvoiceUseCase.execute(bookingId),
    sendAdminSms: async (params) => {
      const agency = await agencyRepository.findById(params.agencyId);
      if (!agency?.smsEnabled || !agency.smsAdminPhone) return;
      const { sendSms } = await import("@/infrastructure/brevo/send-sms");
      const lines = [
        `Nouvelle resa payee`,
        `${params.customerName}`,
        `${params.customerEmail}`,
        `Tel: ${params.customerPhone}`,
        `${params.vehicleName}`,
        `${params.startDate} ${params.startTime} - ${params.endDate} ${params.endTime}`,
        `Total: ${Math.round(params.totalPrice)} EUR`,
      ];
      if (params.options && params.options.length > 0) {
        lines.push(
          `Options: ${params.options.map((o) => `${o.name}${o.quantity > 1 ? ` x${o.quantity}` : ""}`).join(", ")}`
        );
      }
      await sendSms({
        to: agency.smsAdminPhone,
        content: lines.join("\n"),
      });
    },
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

  const getPlanningDataUseCase = createGetPlanningDataUseCase({
    vehicleRepository,
    bookingRepository,
  });

  const generateContractUseCase = createGenerateContractUseCase({
    bookingRepository,
    customerRepository,
    vehicleRepository,
    agencyRepository,
    optionRepository,
    documentRepository,
    contractFieldsRepository,
    pdfRenderer: createReactPdfContractRenderer(),
  });

  const generateQuoteUseCase = createGenerateQuoteUseCase({
    quoteRepository,
    customerRepository,
    vehicleRepository,
    agencyRepository,
    documentRepository,
    numberAllocator: createSupabaseQuoteNumberAllocator(),
    pdfRenderer: createReactPdfQuoteRenderer(),
  });

  // Use case partagé entre `deleteBookingUseCase` (consommé directement
  // depuis le tableau résa) et `deleteCustomerUseCase` (qui l'appelle en
  // boucle pour chaque résa du client).
  const deleteBookingUseCase = createDeleteBookingUseCase({
    bookingRepository,
    documentRepository,
    inspectionRepository,
  });

  cachedContainer = {
    vehicleRepository,
    agencyRepository,
    bookingRepository,
    customerRepository,
    paymentRepository,
    optionRepository,
    documentRepository,
    contractFieldsRepository,
    customerDocumentRepository,
    quoteRepository,
    inspectionRepository,
    paymentGateway,
    notifier,
    initiateBookingUseCase,
    startCheckoutUseCase,
    confirmBookingPaymentUseCase,
    handlePaymentFailedUseCase,
    recordRefundedChargeUseCase,
    verifyCheckoutSessionUseCase,
    getPlanningDataUseCase,
    getStatisticsUseCase: createGetStatisticsUseCase({
      bookingRepository,
      vehicleRepository,
    }),
    listOptionsUseCase: createListOptionsUseCase({ optionRepository }),
    createOptionUseCase: createCreateOptionUseCase({ optionRepository }),
    updateOptionUseCase: createUpdateOptionUseCase({ optionRepository }),
    deleteOptionUseCase: createDeleteOptionUseCase({ optionRepository }),
    updateAgencyTermsUseCase: createUpdateAgencyTermsUseCase({
      agencyRepository,
    }),
    updateAgencyDetailsUseCase: createUpdateAgencyDetailsUseCase({
      agencyRepository,
    }),
    uploadDocumentUseCase: createUploadDocumentUseCase({ documentRepository }),
    listDocumentsUseCase: createListDocumentsUseCase({ documentRepository }),
    deleteDocumentUseCase: createDeleteDocumentUseCase({ documentRepository }),
    getDocumentSignedUrlUseCase: createGetDocumentSignedUrlUseCase({
      documentRepository,
    }),
    generateInvoiceUseCase,
    generateContractUseCase,
    saveContractFieldsUseCase: createSaveContractFieldsUseCase({
      contractFieldsRepository,
      generateContractUseCase,
    }),
    generateQuoteUseCase,
    generateInspectionUseCase: createGenerateInspectionUseCase({
      inspectionRepository,
      bookingRepository,
      customerRepository,
      vehicleRepository,
      agencyRepository,
      documentRepository,
      pdfRenderer: createReactPdfInspectionRenderer(),
    }),
    sendBookingDocumentsUseCase: createSendBookingDocumentsUseCase({
      bookingRepository,
      customerRepository,
      vehicleRepository,
      documentRepository,
      notifier,
    }),
    deleteBookingUseCase,
    deleteCustomerUseCase: createDeleteCustomerUseCase({
      customerRepository,
      bookingRepository,
      quoteRepository,
      customerDocumentRepository,
      documentRepository,
      deleteBookingUseCase,
    }),
  };
  return cachedContainer;
};
