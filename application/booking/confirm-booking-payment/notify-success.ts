import { formatDateCayenne } from "@/lib/format-date";
import type { Booking } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type { OptionRepository } from "@/domain/option";
import type { Notifier } from "../../notifications/notification.port";
import type { SendAdminSmsParams } from "./types";

interface Args {
  customerRepository: CustomerRepository;
  vehicleRepository: VehicleRepository;
  optionRepository: OptionRepository;
  notifier: Notifier;
  adminEmail: string;
  sendAdminSms?: (params: SendAdminSmsParams) => Promise<void>;
  booking: Booking;
}

/**
 * Envoie les notifications post-paiement : email client + email admin
 * + SMS admin (si configuré). Tous les envois sont fire-and-forget : un
 * échec est loggé mais ne bloque pas la mise à jour du statut booking. */
export async function notifyBookingPaid({
  customerRepository,
  vehicleRepository,
  optionRepository,
  notifier,
  adminEmail,
  sendAdminSms,
  booking,
}: Args): Promise<void> {
  const customer = await customerRepository.findById(booking.customerId);
  const vehicle = await vehicleRepository.findById(booking.vehicleId);
  if (!customer || !vehicle) return;

  const bookingOptions = await optionRepository.listForBooking(booking.id);
  const optionsSummary = bookingOptions.map((o) => ({
    name: o.nameSnapshot,
    quantity: o.quantity,
  }));

  const startDate = formatDateCayenne(booking.startDate, "dd MMMM yyyy");
  const startTime = formatDateCayenne(booking.startDate, "HH'h'mm");
  const endDate = formatDateCayenne(booking.endDate, "dd MMMM yyyy");
  const endTime = formatDateCayenne(booking.endDate, "HH'h'mm");

  await notifier.sendBookingPaidToClient({
    to: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    startDate,
    startTime,
    endDate,
    endTime,
    totalPrice: booking.totalPrice,
    vehicle: { brand: vehicle.brand, model: vehicle.model },
    options: optionsSummary,
  });

  await notifier.sendBookingPaidToAdmin({
    to: adminEmail,
    firstName: customer.firstName,
    lastName: customer.lastName,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    bookingId: booking.id,
    startDate,
    startTime,
    endDate,
    endTime,
    totalPrice: booking.totalPrice,
    vehicle: { brand: vehicle.brand, model: vehicle.model },
    options: optionsSummary,
  });

  if (sendAdminSms) {
    sendAdminSms({
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      vehicleName: `${vehicle.brand} ${vehicle.model}`,
      startDate,
      startTime,
      endDate,
      endTime,
      totalPrice: booking.totalPrice,
      agencyId: booking.agencyId,
      options: optionsSummary,
    }).catch((e) => console.error("❌ Admin SMS failed:", e));
  }
}
