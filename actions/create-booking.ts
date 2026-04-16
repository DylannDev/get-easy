"use server";

import { headers } from "next/headers";
import { getContainer } from "@/composition-root/container";
import type { BookingFormData } from "@/lib/validations/booking";

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
 * delegates to StartCheckoutUseCase.
 */
export async function createBookingAction(
  params: CreateBookingParams
): Promise<CreateBookingResult> {
  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    headersList.get("referer")?.split("/").slice(0, 3).join("/") ||
    "http://localhost:3000";

  const { startCheckoutUseCase } = getContainer();
  return startCheckoutUseCase.execute({
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
}
