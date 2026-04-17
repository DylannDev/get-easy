"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContainer } from "@/composition-root/container";
import { BookingStatus } from "@/domain/booking";
import { findAvailabilityConflict } from "@/domain/vehicle";

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
      monthlyCapSnapshot:
        option.capEnabled && option.priceType === "per_day"
          ? option.monthlyCap
          : null,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/planning");
  redirect("/admin/reservations");
}

interface UpdateManualBookingInput {
  bookingId: string;
  vehicleId: string;
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

/**
 * Met à jour une réservation manuelle existante.
 *
 *  - Statuts éditables : `paid` et `pending_payment` uniquement. Tous les
 *    autres (initiated, cancelled, expired, refunded) renvoient une erreur.
 *  - L'agence n'est PAS modifiable (snapshots options, règles d'agence).
 *  - Le client reste le même (on met à jour ses infos, pas de réassignation).
 *  - Les options sont détachées puis ré-attachées avec de nouveaux snapshots
 *    (idempotent : tout est recomposé à partir de la sélection courante).
 *  - La vérification des dispos ignore le booking courant.
 */
export async function updateManualBooking(
  input: UpdateManualBookingInput
): Promise<{ ok: boolean; error?: string }> {
  const {
    bookingRepository,
    customerRepository,
    vehicleRepository,
    optionRepository,
  } = getContainer();

  const existing = await bookingRepository.findById(input.bookingId);
  if (!existing) {
    return { ok: false, error: "Réservation introuvable." };
  }
  if (
    existing.status !== BookingStatus.Paid &&
    existing.status !== BookingStatus.PendingPayment
  ) {
    return {
      ok: false,
      error:
        "Seules les réservations payées ou en attente de paiement peuvent être modifiées.",
    };
  }

  // Vérification des dispos sur le véhicule cible (peut-être nouveau),
  // en excluant le booking courant.
  const vehicle = await vehicleRepository.findById(input.vehicleId);
  if (!vehicle) {
    return { ok: false, error: "Véhicule introuvable." };
  }
  const conflictBookings =
    await bookingRepository.findActiveAvailabilityViewsByVehicleId(
      input.vehicleId
    );
  const conflict = findAvailabilityConflict(
    vehicle,
    new Date(input.startDate),
    new Date(input.endDate),
    conflictBookings,
    {
      excludeBookingId: input.bookingId,
      // Contexte admin : la gérante édite sa propre résa (même payée).
      allowExcludingPaid: true,
    }
  );
  if (conflict) {
    return {
      ok: false,
      error:
        "Le véhicule n'est pas disponible sur cette période (conflit avec une autre réservation ou une indisponibilité).",
    };
  }

  // Met à jour le client (infos éditées dans le formulaire).
  await customerRepository.update(existing.customerId, input.customer);

  // Met à jour le booking (dates, véhicule, total).
  await bookingRepository.update(input.bookingId, {
    vehicleId: input.vehicleId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPrice: input.totalPrice,
  });

  // Recompose les options : on efface tout et on re-attache.
  await optionRepository.detachAllFromBooking(input.bookingId);
  for (const selected of input.selectedOptions ?? []) {
    const option = await optionRepository.findById(selected.optionId);
    if (!option || !option.active || option.agencyId !== existing.agencyId) {
      continue;
    }
    const qty = Math.max(1, Math.min(option.maxQuantity, selected.quantity));
    await optionRepository.attachToBooking({
      bookingId: input.bookingId,
      optionId: option.id,
      quantity: qty,
      unitPriceSnapshot: option.price,
      priceTypeSnapshot: option.priceType,
      nameSnapshot: option.name,
      monthlyCapSnapshot:
        option.capEnabled && option.priceType === "per_day"
          ? option.monthlyCap
          : null,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath(`/admin/reservations/${input.bookingId}`);
  revalidatePath("/admin/planning");
  return { ok: true };
}
