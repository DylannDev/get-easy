"use server";

import { headers } from "next/headers";
import { getContainer } from "@/composition-root/container";
import type { BookingFormData } from "@/lib/validations/booking";
import type { CustomerDocumentType } from "@/domain/customer-document";

interface StagedDocumentInput {
  stagingKey: string;
  type: CustomerDocumentType;
  fileName: string;
  mimeType: string;
  size: number;
}

interface CreateBookingParams {
  customerData: BookingFormData;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  agencyId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  selectedOptions?: { optionId: string; quantity: number }[];
  /** Booking id from the `initiated` step (optional). */
  bookingId?: string;
  /** Documents client importés en staging avant submit. */
  stagedDocuments?: StagedDocumentInput[];
}

interface CreateBookingResult {
  success: boolean;
  customerId?: string;
  bookingId?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Server action: thin entry point that resolves the request origin and
 * delegates to StartCheckoutUseCase, then finalizes any staged customer
 * documents once the customer has been created/found.
 */
export async function createBookingAction(
  params: CreateBookingParams,
): Promise<CreateBookingResult> {
  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    headersList.get("referer")?.split("/").slice(0, 3).join("/") ||
    "http://localhost:3000";

  const { startCheckoutUseCase, agencyRepository, customerDocumentRepository } =
    getContainer();

  const result = await startCheckoutUseCase.execute({
    customerData: params.customerData,
    vehicleId: params.vehicleId,
    vehicleBrand: params.vehicleBrand,
    vehicleModel: params.vehicleModel,
    agencyId: params.agencyId,
    startDate: params.startDate,
    endDate: params.endDate,
    totalPrice: params.totalPrice,
    selectedOptions: params.selectedOptions,
    bookingId: params.bookingId,
    origin,
  });

  if (
    result.success &&
    result.customerId &&
    result.bookingId &&
    params.stagedDocuments &&
    params.stagedDocuments.length > 0
  ) {
    // Finalise les documents en staging en les liant au customer + booking
    // fraîchement créés. Les erreurs sont loggées mais ne bloquent pas le
    // flow de paiement — les documents sont facultatifs et re-uploadables.
    const agency = await agencyRepository.findById(params.agencyId);
    if (agency?.organizationId) {
      await Promise.all(
        params.stagedDocuments.map(async (doc) => {
          try {
            await customerDocumentRepository.finalizeFromStaging({
              stagingKey: doc.stagingKey,
              customerId: result.customerId!,
              bookingId: result.bookingId!,
              type: doc.type,
              organizationId: agency.organizationId!,
              fileName: doc.fileName,
              mimeType: doc.mimeType,
              size: doc.size,
            });
          } catch (e) {
            console.error(
              `[booking] Failed to finalize customer document (${doc.type}):`,
              e,
            );
          }
        }),
      );
    }
  }

  return result;
}
