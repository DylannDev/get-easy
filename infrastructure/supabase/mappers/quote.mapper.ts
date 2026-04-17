import type { Database } from "../database.types";
import type { Quote, QuoteOption } from "@/domain/quote";
import type { OptionPriceType } from "@/domain/option";

type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"];
type QuoteOptionRow = Database["public"]["Tables"]["quote_options"]["Row"];

export function toDomainQuote(row: QuoteRow): Quote {
  return {
    id: row.id,
    agencyId: row.agency_id,
    customerId: row.customer_id,
    vehicleId: row.vehicle_id,
    startDate: row.start_date,
    endDate: row.end_date,
    basePrice: Number(row.base_price),
    optionsTotal: Number(row.options_total),
    cglTotal: Number(row.cgl_total),
    totalPrice: Number(row.total_price),
    validUntil: row.valid_until,
    createdAt: row.created_at,
    createdBy: row.created_by ?? null,
  };
}

export function toDomainQuoteOption(row: QuoteOptionRow): QuoteOption {
  return {
    id: row.id,
    quoteId: row.quote_id,
    optionId: row.option_id,
    quantity: row.quantity,
    unitPriceSnapshot: Number(row.unit_price_snapshot),
    priceTypeSnapshot: row.price_type_snapshot as OptionPriceType,
    nameSnapshot: row.name_snapshot,
    monthlyCapSnapshot:
      row.monthly_cap_snapshot != null
        ? Number(row.monthly_cap_snapshot)
        : null,
  };
}
