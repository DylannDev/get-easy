/** Formate un nombre en euros avec virgule (ex. `12,50 €`). Utilisé pour
 *  pré-remplir les champs "prix/jour" et "total" du contrat. */
export function formatEurMoney(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

/** Formate une date en français, jour-mois-année + heure : "12 mars 2026 à 14h30". */
export function formatLongDateTime(d: Date): string {
  return `${d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })} à ${d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
