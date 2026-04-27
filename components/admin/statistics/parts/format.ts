/** Formate un nombre en euros sans décimale (ex. `12 345 €`). */
export function fmtEur(n: number): string {
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
}

/** Format compact pour l'axe Y du chart CA — évite "0k 0k 1k 1k 1k" quand
 *  les valeurs sont petites en gardant un préfixe "k" pour les milliers. */
export function fmtAxisY(v: number): string {
  if (v === 0) return "0";
  if (Math.abs(v) >= 1000) {
    const k = v / 1000;
    return `${k.toFixed(k % 1 === 0 ? 0 : 1)}k`;
  }
  return String(v);
}

export const MONTH_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];
