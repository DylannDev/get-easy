import type { OptionPriceType } from "../option";

/**
 * Un devis est un document pré-contractuel produit avant la création
 * d'une réservation — mêmes données commerciales (véhicule, client,
 * dates, options, prix) mais sans engagement de location. L'agence
 * le télécharge en PDF pour le remettre au prospect.
 */
export interface Quote {
  id: string;
  agencyId: string;
  customerId: string;
  vehicleId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  /** Prix du véhicule seul (hors options / CGL). */
  basePrice: number;
  /** Somme des lignes d'options (avec snapshots figés). */
  optionsTotal: number;
  /** Part des CGL facturée (0 si l'agence n'utilise pas ce champ). */
  cglTotal: number;
  /** Total TTC figé à la génération (= basePrice + optionsTotal + cglTotal). */
  totalPrice: number;
  /** Date limite de validité du devis (YYYY-MM-DD). */
  validUntil: string;
  createdAt: string;
  createdBy: string | null;
}

/** Ligne d'option attachée à un devis (snapshot complet). */
export interface QuoteOption {
  id: string;
  quoteId: string;
  optionId: string;
  quantity: number;
  unitPriceSnapshot: number;
  priceTypeSnapshot: OptionPriceType;
  nameSnapshot: string;
  monthlyCapSnapshot: number | null;
}

/** Un devis dont la date de validité est passée. */
export function isQuoteExpired(quote: Pick<Quote, "validUntil">, now = new Date()): boolean {
  // Comparaison date-only (côté locale serveur). Un devis valable "jusqu'au
  // 2026-05-10" reste valide toute la journée du 10.
  const until = new Date(quote.validUntil + "T23:59:59");
  return until.getTime() < now.getTime();
}
