/**
 * Formate un montant en euros sans afficher les centimes quand ils sont nuls.
 *
 *  - 5    → "5 €"
 *  - 5.50 → "5,50 €"
 *  - 50   → "50 €"
 *  - 99.99 → "99,99 €"
 *
 * Convention française : virgule comme séparateur décimal, espace insécable
 * entre le nombre et le symbole géré par le caller si besoin (ici espace
 * standard suffit dans la majorité des UIs).
 */
export function formatMoney(n: number): string {
  if (Number.isInteger(n)) return `${n} €`;
  return `${n.toFixed(2).replace(".", ",")} €`;
}
