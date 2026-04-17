import {
  fetchNextQuoteNumber,
  formatQuoteNumber,
} from "./quote-numbering.service";
import type { QuoteNumberAllocator } from "@/application/admin/documents/generate-quote.use-case";

export const createSupabaseQuoteNumberAllocator =
  (): QuoteNumberAllocator => ({
    async allocate(organizationId: string, year: number): Promise<string> {
      const n = await fetchNextQuoteNumber(organizationId, year);
      return formatQuoteNumber(year, n);
    },
  });
