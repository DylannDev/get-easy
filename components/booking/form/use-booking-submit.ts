"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { formatDateTimeFR } from "@/lib/utils";
import { createBookingAction } from "@/actions/create-booking";
import { checkVehicleAvailability } from "@/actions/check-vehicle-availability";
import {
  stagedDocsToPayload,
  type StagedDocState,
} from "../customer-documents-upload";
import type { BookingFormData } from "@/lib/validations/booking";
import type { Vehicle } from "@/types";

interface Args {
  vehicle: Vehicle;
  agencyId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  selectedOptions?: { optionId: string; quantity: number }[];
  bookingId?: string;
}

/** Construit le message d'erreur d'indispo selon le type de conflit. */
function buildConflictMessage(
  status: string | null | undefined,
  conflictStart: string | null | undefined,
  conflictEnd: string | null | undefined,
): string {
  if (!conflictStart || !conflictEnd) {
    return "Ce véhicule n'est plus disponible pour la période sélectionnée. Merci de choisir d'autres dates ou un autre véhicule.";
  }
  const formattedStart = formatDateTimeFR(new Date(conflictStart));
  const formattedEnd = formatDateTimeFR(new Date(conflictEnd));

  switch (status) {
    case "pending_payment":
      return `Ce véhicule est en cours de réservation du ${formattedStart} au ${formattedEnd}. Veuillez sélectionner d'autres dates ou un autre véhicule.`;
    case "paid":
      return `Ce véhicule est déjà réservé du ${formattedStart} au ${formattedEnd}. Veuillez sélectionner d'autres dates ou un autre véhicule.`;
    case "blocked_period":
      return `Ce véhicule est indisponible du ${formattedStart} au ${formattedEnd}. Veuillez sélectionner d'autres dates ou un autre véhicule.`;
    default:
      return "Ce véhicule n'est plus disponible pour la période sélectionnée. Merci de choisir d'autres dates ou un autre véhicule.";
  }
}

/**
 * Encapsule la soumission du formulaire de réservation publique : check
 * de disponibilité (avec exclusion du booking courant en édition), gestion
 * de l'erreur, conversion des pièces jointes en staging, et redirection
 * Stripe Checkout. Le caller garde uniquement react-hook-form + l'état
 * d'erreur affiché.
 */
export function useBookingSubmit({
  vehicle,
  agencyId,
  startDate,
  endDate,
  totalPrice,
  selectedOptions,
  bookingId,
}: Args) {
  const router = useRouter();
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [stagedDocs, setStagedDocs] = useState<StagedDocState>({});

  const submit = async (data: BookingFormData) => {
    try {
      setBookingError(null);

      // Vérifier la disponibilité (exclut le booking courant en édition).
      const availability = await checkVehicleAvailability({
        vehicleId: vehicle.id,
        startDate,
        endDate,
        excludeBookingId: bookingId,
      });

      if (!availability.available) {
        const message = buildConflictMessage(
          availability.conflictStatus,
          availability.conflictStart,
          availability.conflictEnd,
        );
        setBookingError(message);
        toast.error(message);
        return;
      }

      const stagedDocuments = stagedDocsToPayload(stagedDocs);

      const result = await createBookingAction({
        customerData: data,
        vehicleId: vehicle.id,
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model,
        agencyId,
        startDate,
        endDate,
        totalPrice,
        selectedOptions,
        bookingId,
        stagedDocuments,
      });

      if (!result.success) {
        const message = result.error || "Une erreur est survenue";
        setBookingError(message);
        toast.error(message);
        return;
      }

      if (!result.checkoutUrl) {
        const message = "Impossible de créer la session de paiement";
        setBookingError(message);
        toast.error(message);
        return;
      }

      router.push(result.checkoutUrl);
    } catch (error) {
      console.error("❌ Erreur lors de la soumission:", error);
      setBookingError("Une erreur inattendue s'est produite");
      toast.error("Une erreur inattendue s'est produite");
    }
  };

  return { bookingError, stagedDocs, setStagedDocs, submit };
}
