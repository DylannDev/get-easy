import { formatDateCayenne } from "@/lib/format-date";
import type { CustomerRepository } from "@/domain/customer";
import type { VehicleRepository } from "@/domain/vehicle";
import type { PaymentGateway } from "@/domain/payment";
import type { Notifier } from "../../notifications/notification.port";

/** Tente un remboursement Stripe sans propager les erreurs (on log et on
 *  continue — un échec ne doit pas bloquer la suite du flow webhook). */
export async function refundSafe(
  paymentGateway: PaymentGateway,
  intentId: string | null,
  reason: "duplicate" | "requested_by_customer",
): Promise<void> {
  if (!intentId) return;
  try {
    await paymentGateway.refundByIntentId(intentId, reason);
  } catch (e) {
    console.error("❌ Refund failed:", e);
  }
}

interface NotifyArgs {
  customerRepository: CustomerRepository;
  vehicleRepository: VehicleRepository;
  notifier: Notifier;
  customerId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  reason: "unavailable" | "already_paid" | "not_found";
}

/** Envoie l'email "réservation refusée" au client avec la raison appropriée
 *  (déjà payée / dates prises / non trouvée). Silencieux si client ou
 *  véhicule introuvables. */
export async function notifyRejected({
  customerRepository,
  vehicleRepository,
  notifier,
  customerId,
  vehicleId,
  startDate,
  endDate,
  reason,
}: NotifyArgs): Promise<void> {
  const customer = await customerRepository.findById(customerId);
  const vehicle = await vehicleRepository.findById(vehicleId);
  if (!customer || !vehicle) return;
  await notifier.sendBookingRejected({
    to: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    vehicle: { brand: vehicle.brand, model: vehicle.model },
    startDate: formatDateCayenne(startDate, "dd MMMM yyyy"),
    endDate: formatDateCayenne(endDate, "dd MMMM yyyy"),
    reason,
  });
}
