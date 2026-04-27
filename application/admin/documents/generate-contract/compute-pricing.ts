import type { BookingOption } from "@/domain/option";
import { computeOptionLineTotal } from "@/domain/option";

interface Args {
  options: BookingOption[];
  numberOfDays: number;
  bookingTotalPrice: number;
}

/**
 * Recalcule le prix/jour véhicule "net" à afficher sur le contrat = total
 * de la réservation moins le total des options (snapshots à la date de
 * réservation pour respecter la facturation initiale). Le prix/jour est
 * ensuite utilisé comme valeur par défaut du champ éditable.
 */
export function computeContractPricing({
  options,
  numberOfDays,
  bookingTotalPrice,
}: Args): { pricePerDay: number; vehicleTotal: number } {
  const optionsTotalSnapshot = options.reduce(
    (acc, bo) =>
      acc +
      computeOptionLineTotal(
        {
          unitPrice: bo.unitPriceSnapshot,
          priceType: bo.priceTypeSnapshot,
          quantity: bo.quantity,
          monthlyCap: bo.monthlyCapSnapshot,
        },
        numberOfDays,
      ),
    0,
  );
  const vehicleTotal = Math.max(0, bookingTotalPrice - optionsTotalSnapshot);
  const pricePerDay = vehicleTotal / numberOfDays;
  return { pricePerDay, vehicleTotal };
}
