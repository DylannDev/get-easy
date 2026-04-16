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
}

export interface BookingOption {
  id: string;
  bookingId: string;
  optionId: string;
  quantity: number;
  unitPriceSnapshot: number;
  priceTypeSnapshot: OptionPriceType;
  nameSnapshot: string;
}
