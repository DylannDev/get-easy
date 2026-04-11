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
}

export async function createManualBooking(input: ManualBookingInput) {
  const { customerRepository, bookingRepository } = getContainer();

  // Find or create customer
  let customer = await customerRepository.findByEmail(input.customer.email);
  if (!customer) {
    customer = await customerRepository.create({
      ...input.customer,
    });
  }

  // Create booking as paid directly
  await bookingRepository.create({
    customerId: customer.id,
    vehicleId: input.vehicleId,
    agencyId: input.agencyId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPrice: input.totalPrice,
    status: BookingStatus.Paid,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/planning");
  redirect("/admin/reservations");
}
