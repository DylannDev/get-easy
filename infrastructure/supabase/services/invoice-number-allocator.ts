import {
  fetchNextInvoiceNumber,
  formatInvoiceNumber,
} from "./invoice-numbering.service";
import type { InvoiceNumberAllocator } from "@/application/admin/documents/generate-invoice.use-case";

export const createSupabaseInvoiceNumberAllocator =
  (): InvoiceNumberAllocator => ({
    async allocate(organizationId: string, year: number): Promise<string> {
      const n = await fetchNextInvoiceNumber(organizationId, year);
      return formatInvoiceNumber(year, n);
    },
  });
