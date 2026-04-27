/**
 * Normalise une chaîne pour comparaison insensible à la casse, aux accents
 * et aux espaces multiples (ex : "Élise  Dupont" === "elise dupont").
 * Utilisé dans les dialogs de confirmation de suppression où l'utilisateur
 * doit re-taper le nom à supprimer.
 */
export function normalizeForCompare(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
