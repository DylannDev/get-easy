/** Onglets disponibles dans la vue documents (admin). Le tab "other" est
 *  volontairement masqué — pourra être réintroduit plus tard si besoin. */
export type TabKey = "invoice" | "quote" | "contract" | "inspection";

export const VALID_TABS: TabKey[] = [
  "invoice",
  "quote",
  "contract",
  "inspection",
];

export const TABS: { key: TabKey; label: string }[] = [
  { key: "invoice", label: "Factures" },
  { key: "quote", label: "Devis" },
  { key: "contract", label: "Contrats" },
  { key: "inspection", label: "États des lieux" },
];

export const INSPECTION_TYPE_LABELS: Record<"departure" | "return", string> = {
  departure: "Départ",
  return: "Retour",
};

export function isValidTab(value: string | null): value is TabKey {
  return value !== null && (VALID_TABS as string[]).includes(value);
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
}
