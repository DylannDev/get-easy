import type { BookingOption } from "@/domain/option";
import { computeOptionLineTotal } from "@/domain/option";
import type { Vehicle } from "@/domain/vehicle";
import type { InvoiceItem } from "./types";

interface Args {
  vehicle: Vehicle;
  bookingOptions: BookingOption[];
  bookingTotalPrice: number;
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
}

/**
 * Construit la liste des lignes de facture (véhicule + options) ainsi que
 * le prix/jour véhicule "net". Le prix/jour est reconstitué à partir du
 * `totalPrice` autoritaire du booking (posté par Stripe) moins la somme
 * des options facturées via leurs snapshots — pour rester cohérent avec
 * ce que le client a réellement payé, indépendamment d'éventuels
 * changements de tarif ultérieurs.
 */
export function buildInvoiceItems({
  vehicle,
  bookingOptions,
  bookingTotalPrice,
  startDate,
  endDate,
  numberOfDays,
}: Args): { items: InvoiceItem[]; pricePerDay: number } {
  const optionsTotalSnapshot = bookingOptions.reduce(
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

  const items: InvoiceItem[] = [
    {
      label: `Location ${vehicle.brand} ${vehicle.model} du ${startDate.toLocaleDateString("fr-FR")} au ${endDate.toLocaleDateString("fr-FR")}`,
      quantity: numberOfDays,
      unitPriceTTC: pricePerDay,
      totalTTC: vehicleTotal,
    },
    ...bookingOptions.map((bo) => {
      const isPerDay = bo.priceTypeSnapshot === "per_day";
      const totalForLine = computeOptionLineTotal(
        {
          unitPrice: bo.unitPriceSnapshot,
          priceType: bo.priceTypeSnapshot,
          quantity: bo.quantity,
          monthlyCap: bo.monthlyCapSnapshot,
        },
        numberOfDays,
      );
      const capSuffix =
        bo.monthlyCapSnapshot != null
          ? ` — plafonné à ${bo.monthlyCapSnapshot.toFixed(2)} €/mois`
          : "";
      const label = isPerDay
        ? `${bo.nameSnapshot} (${bo.unitPriceSnapshot.toFixed(2)} €/j × ${numberOfDays} j${capSuffix})`
        : `${bo.nameSnapshot} (forfait)`;
      return {
        label,
        quantity: bo.quantity,
        unitPriceTTC:
          bo.quantity > 0 ? totalForLine / bo.quantity : totalForLine,
        totalTTC: totalForLine,
      };
    }),
  ];

  return { items, pricePerDay };
}
