import { createAdminClient } from "../client";

/**
 * Returns the next invoice sequence number for `(organization, year)` —
 * atomic thanks to the Postgres function `next_invoice_number` (UPSERT with
 * conflict-do-update). Safe under concurrent webhooks.
 */
export async function fetchNextInvoiceNumber(
  organizationId: string,
  year: number
): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("next_invoice_number", {
    p_organization_id: organizationId,
    p_year: year,
  });
  if (error || data === null || data === undefined) {
    throw new Error(
      `Impossible d'allouer un numéro de facture : ${
        error?.message ?? "erreur inconnue"
      }`
    );
  }
  return Number(data);
}

/** Formats (year, n) into "FAC-{year}-{NNN}" with 3-digit zero-padding. */
export function formatInvoiceNumber(year: number, n: number): string {
  return `FAC-${year}-${String(n).padStart(3, "0")}`;
}
