import type { Option, BookingOption, OptionPriceType } from "./option.entity";

export interface CreateOptionInput {
  agencyId: string;
  name: string;
  description?: string | null;
  priceType: OptionPriceType;
  price: number;
  maxQuantity: number;
  active?: boolean;
  sortOrder?: number;
  capEnabled?: boolean;
  monthlyCap?: number | null;
}

export interface UpdateOptionInput {
  name?: string;
  description?: string | null;
  priceType?: OptionPriceType;
  price?: number;
  maxQuantity?: number;
  active?: boolean;
  sortOrder?: number;
  capEnabled?: boolean;
  monthlyCap?: number | null;
}

export interface AttachOptionToBookingInput {
  bookingId: string;
  optionId: string;
  quantity: number;
  unitPriceSnapshot: number;
  priceTypeSnapshot: OptionPriceType;
  nameSnapshot: string;
  monthlyCapSnapshot: number | null;
}

export interface OptionRepository {
  listByAgency(agencyId: string): Promise<Option[]>;
  listActiveByAgency(agencyId: string): Promise<Option[]>;
  findById(id: string): Promise<Option | null>;
  create(input: CreateOptionInput): Promise<Option>;
  update(id: string, input: UpdateOptionInput): Promise<Option | null>;
  delete(id: string): Promise<void>;

  listForBooking(bookingId: string): Promise<BookingOption[]>;
  attachToBooking(input: AttachOptionToBookingInput): Promise<BookingOption>;
  detachAllFromBooking(bookingId: string): Promise<void>;
}
