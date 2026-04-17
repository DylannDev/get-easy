import type { Database } from "../database.types";
import type {
  Option,
  BookingOption,
  OptionPriceType,
} from "@/domain/option";

type OptionRow = Database["public"]["Tables"]["options"]["Row"];
type BookingOptionRow = Database["public"]["Tables"]["booking_options"]["Row"];

export function toDomainOption(row: OptionRow): Option {
  return {
    id: row.id,
    agencyId: row.agency_id,
    name: row.name,
    description: row.description,
    priceType: row.price_type as OptionPriceType,
    price: Number(row.price),
    maxQuantity: row.max_quantity,
    active: row.active,
    sortOrder: row.sort_order,
    capEnabled:
      ((row as Record<string, unknown>).cap_enabled as boolean | undefined) ??
      false,
    monthlyCap: (() => {
      const v = (row as Record<string, unknown>).monthly_cap as
        | number
        | string
        | null
        | undefined;
      if (v === null || v === undefined) return null;
      return typeof v === "string" ? Number(v) : v;
    })(),
  };
}

export function toDomainBookingOption(row: BookingOptionRow): BookingOption {
  const cap = (row as Record<string, unknown>).monthly_cap_snapshot as
    | number
    | string
    | null
    | undefined;
  return {
    id: row.id,
    bookingId: row.booking_id,
    optionId: row.option_id,
    quantity: row.quantity,
    unitPriceSnapshot: Number(row.unit_price_snapshot),
    priceTypeSnapshot: row.price_type_snapshot as OptionPriceType,
    nameSnapshot: row.name_snapshot,
    monthlyCapSnapshot:
      cap === null || cap === undefined
        ? null
        : typeof cap === "string"
          ? Number(cap)
          : cap,
  };
}
