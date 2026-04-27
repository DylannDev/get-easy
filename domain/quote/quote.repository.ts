import type { Quote, QuoteOption } from "./quote.entity";
import type { OptionPriceType } from "../option";

export interface CreateQuoteInput {
  agencyId: string;
  customerId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  optionsTotal: number;
  cglTotal: number;
  totalPrice: number;
  validUntil: string; // YYYY-MM-DD
  createdBy?: string | null;
}

export interface AttachOptionToQuoteInput {
  quoteId: string;
  optionId: string;
  quantity: number;
  unitPriceSnapshot: number;
  priceTypeSnapshot: OptionPriceType;
  nameSnapshot: string;
  monthlyCapSnapshot: number | null;
}

export interface QuoteRepository {
  findById(id: string): Promise<Quote | null>;
  /** Liste les devis d'une agence, triés par date de création décroissante. */
  listByAgency(agencyId: string): Promise<Quote[]>;
  /** Liste les devis d'un client — utilisé pour le cleanup cascade
   *  lors de la suppression du client (FK quotes.customer_id RESTRICT). */
  listByCustomerId(customerId: string): Promise<Quote[]>;
  create(input: CreateQuoteInput): Promise<Quote>;
  /** Hard-delete d'un devis. Les `quote_options` partent en cascade BDD. */
  delete(quoteId: string): Promise<void>;

  /** Lignes d'options attachées à un devis (ordre d'insertion). */
  listOptionsForQuote(quoteId: string): Promise<QuoteOption[]>;
  attachOption(input: AttachOptionToQuoteInput): Promise<QuoteOption>;
}
