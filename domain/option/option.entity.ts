export type OptionPriceType = "per_day" | "flat";

export interface Option {
  id: string;
  agencyId: string;
  name: string;
  description: string | null;
  priceType: OptionPriceType;
  price: number;
  maxQuantity: number;
  active: boolean;
  sortOrder: number;
  /** Active un plafond mensuel (uniquement pertinent pour priceType=per_day). */
  capEnabled: boolean;
  /** Montant du plafond mensuel (€), appliqué par tranche de 30 jours entamée. */
  monthlyCap: number | null;
}

export interface BookingOption {
  id: string;
  bookingId: string;
  optionId: string;
  quantity: number;
  unitPriceSnapshot: number;
  priceTypeSnapshot: OptionPriceType;
  nameSnapshot: string;
  /** Plafond mensuel figé au moment de l'achat. NULL si pas de plafond. */
  monthlyCapSnapshot: number | null;
}
