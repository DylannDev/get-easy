import { createAdminClient } from "../client";

/**
 * Alloue le prochain numéro de devis pour `(organisation, année)` —
 * atomique grâce à la fonction Postgres `next_quote_number` (advisory
 * lock + UPSERT). Miroir de `fetchNextInvoiceNumber` pour les factures.
 */
export async function fetchNextQuoteNumber(
  organizationId: string,
  year: number
): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("next_quote_number", {
    p_organization_id: organizationId,
    p_year: year,
  });
  if (error || data === null || data === undefined) {
    throw new Error(
      `Impossible d'allouer un numéro de devis : ${
        error?.message ?? "erreur inconnue"
      }`
    );
  }
  return Number(data);
}

/** Formats (year, n) into "DEV-{year}-{NNN}" with 3-digit zero-padding. */
export function formatQuoteNumber(year: number, n: number): string {
  return `DEV-${year}-${String(n).padStart(3, "0")}`;
}
