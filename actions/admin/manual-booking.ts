"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContainer } from "@/composition-root/container";
import { BookingStatus } from "@/domain/booking";

interface ManualBookingInput {
  vehicleId: string;
  agencyId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
  };
  selectedOptions?: { optionId: string; quantity: number }[];
}

export async function createManualBooking(input: ManualBookingInput) {
  const { customerRepository, bookingRepository, optionRepository } =
    getContainer();

  // Find or create customer
  let customer = await customerRepository.findByEmail(input.customer.email);
  if (!customer) {
    customer = await customerRepository.create({
      ...input.customer,
    });
  }

  // Create booking as paid directly
  const booking = await bookingRepository.create({
    customerId: customer.id,
    vehicleId: input.vehicleId,
    agencyId: input.agencyId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPrice: input.totalPrice,
    status: BookingStatus.Paid,
  });

  // Attach selected options with server-side snapshots
  for (const selected of input.selectedOptions ?? []) {
    const option = await optionRepository.findById(selected.optionId);
    if (!option || !option.active || option.agencyId !== input.agencyId) {
      continue;
    }
    const qty = Math.max(1, Math.min(option.maxQuantity, selected.quantity));
    await optionRepository.attachToBooking({
      bookingId: booking.id,
      optionId: option.id,
      quantity: qty,
      unitPriceSnapshot: option.price,
      priceTypeSnapshot: option.priceType,
      nameSnapshot: option.name,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/planning");
  redirect("/admin/reservations");
}
