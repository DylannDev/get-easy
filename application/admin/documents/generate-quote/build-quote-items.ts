import { computeOptionLineTotal } from "@/domain/option";
import type { Quote, QuoteOption } from "@/domain/quote";
import type { Vehicle } from "@/domain/vehicle";
import type { QuoteItem } from "./types";

interface Args {
  vehicle: Vehicle;
  quote: Quote;
  quoteOptions: QuoteOption[];
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
}

/**
 * Construit les lignes du devis (véhicule + options) ainsi que le prix/jour
 * véhicule reconstitué. Les snapshots côté quote (basePrice + cglTotal,
 * unitPriceSnapshot…) restent autoritaires : les options ne sont pas
 * recalculées même si l'agence modifie ses tarifs après l'envoi du devis.
 */
export function buildQuoteItems({
  vehicle,
  quote,
  quoteOptions,
  startDate,
  endDate,
  numberOfDays,
}: Args): { items: QuoteItem[]; pricePerDay: number } {
  // `basePrice` est figé au moment de la création du devis (gère les
  // tarifs dégressifs + CGL éventuelles). On reconstitue le prix/jour
  // pour la colonne "Prix unitaire" de la ligne véhicule du PDF.
  const vehicleTotal = quote.basePrice + quote.cglTotal;
  const pricePerDay = vehicleTotal / numberOfDays;

  const items: QuoteItem[] = [
    {
      label: `Location ${vehicle.brand} ${vehicle.model} du ${startDate.toLocaleDateString("fr-FR")} au ${endDate.toLocaleDateString("fr-FR")}`,
      quantity: numberOfDays,
      unitPriceTTC: pricePerDay,
      totalTTC: vehicleTotal,
    },
    ...quoteOptions.map((qo) => {
      const isPerDay = qo.priceTypeSnapshot === "per_day";
      const totalForLine = computeOptionLineTotal(
        {
          unitPrice: qo.unitPriceSnapshot,
          priceType: qo.priceTypeSnapshot,
          quantity: qo.quantity,
          monthlyCap: qo.monthlyCapSnapshot,
        },
        numberOfDays,
      );
      const capSuffix =
        qo.monthlyCapSnapshot != null
          ? ` — plafonné à ${qo.monthlyCapSnapshot.toFixed(2)} €/mois`
          : "";
      const label = isPerDay
        ? `${qo.nameSnapshot} (${qo.unitPriceSnapshot.toFixed(2)} €/j × ${numberOfDays} j${capSuffix})`
        : `${qo.nameSnapshot} (forfait)`;
      return {
        label,
        quantity: qo.quantity,
        unitPriceTTC:
          qo.quantity > 0 ? totalForLine / qo.quantity : totalForLine,
        totalTTC: totalForLine,
      };
    }),
  ];

  return { items, pricePerDay };
}
