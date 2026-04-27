"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContainer } from "@/composition-root/container";
import { BookingStatus } from "@/domain/booking";
import { findAvailabilityConflict } from "@/domain/vehicle";
import { attachBookingOptions } from "./manual-booking/attach-booking-options";
import { finalizeStagedDocuments } from "./manual-booking/finalize-staged-documents";
import type {
  ManualBookingCustomerInput,
  SelectedOptionInput,
  StagedDocumentInput,
} from "./manual-booking/types";

interface ManualBookingInput {
  vehicleId: string;
  agencyId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  customer: ManualBookingCustomerInput;
  selectedOptions?: SelectedOptionInput[];
  stagedDocuments?: StagedDocumentInput[];
}

/**
 * Crée une réservation depuis le wizard admin. Le client est trouvé par
 * email ou créé. Si le client existe déjà et que la gérante a renseigné
 * une raison sociale, on synchronise les champs B2B sans toucher au reste.
 * Les options sont attachées avec snapshots, les pièces jointes en staging
 * sont matérialisées (erreurs silencieuses, docs facultatifs). */
export async function createManualBooking(input: ManualBookingInput) {
  const {
    customerRepository,
    bookingRepository,
    optionRepository,
    agencyRepository,
    customerDocumentRepository,
  } = getContainer();

  let customer = await customerRepository.findByEmail(input.customer.email);
  if (!customer) {
    customer = await customerRepository.create({ ...input.customer });
  } else if (input.customer.companyName) {
    const updated = await customerRepository.update(customer.id, {
      companyName: input.customer.companyName,
      siret: input.customer.siret ?? null,
      vatNumber: input.customer.vatNumber ?? null,
    });
    if (updated) customer = updated;
  }

  const booking = await bookingRepository.create({
    customerId: customer.id,
    vehicleId: input.vehicleId,
    agencyId: input.agencyId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPrice: input.totalPrice,
    status: BookingStatus.Paid,
  });

  await attachBookingOptions({
    optionRepository,
    bookingId: booking.id,
    agencyId: input.agencyId,
    selectedOptions: input.selectedOptions ?? [],
    detachFirst: false,
  });

  await finalizeStagedDocuments({
    customerDocumentRepository,
    agencyRepository,
    agencyId: input.agencyId,
    customerId: customer.id,
    bookingId: booking.id,
    stagedDocuments: input.stagedDocuments ?? [],
  });

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
  customer: ManualBookingCustomerInput;
  selectedOptions?: SelectedOptionInput[];
  stagedDocuments?: StagedDocumentInput[];
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
  input: UpdateManualBookingInput,
): Promise<{ ok: boolean; error?: string }> {
  const {
    bookingRepository,
    customerRepository,
    vehicleRepository,
    optionRepository,
    agencyRepository,
    customerDocumentRepository,
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

  const vehicle = await vehicleRepository.findById(input.vehicleId);
  if (!vehicle) {
    return { ok: false, error: "Véhicule introuvable." };
  }
  const conflictBookings =
    await bookingRepository.findActiveAvailabilityViewsByVehicleId(
      input.vehicleId,
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
    },
  );
  if (conflict) {
    return {
      ok: false,
      error:
        "Le véhicule n'est pas disponible sur cette période (conflit avec une autre réservation ou une indisponibilité).",
    };
  }

  await customerRepository.update(existing.customerId, input.customer);

  await bookingRepository.update(input.bookingId, {
    vehicleId: input.vehicleId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPrice: input.totalPrice,
  });

  await attachBookingOptions({
    optionRepository,
    bookingId: input.bookingId,
    agencyId: existing.agencyId,
    selectedOptions: input.selectedOptions ?? [],
    detachFirst: true,
  });

  await finalizeStagedDocuments({
    customerDocumentRepository,
    agencyRepository,
    agencyId: existing.agencyId,
    customerId: existing.customerId,
    bookingId: input.bookingId,
    stagedDocuments: input.stagedDocuments ?? [],
  });

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath(`/admin/reservations/${input.bookingId}`);
  revalidatePath("/admin/planning");
  return { ok: true };
}
