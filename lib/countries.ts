import countries from "i18n-iso-countries";
import fr from "i18n-iso-countries/langs/fr.json";

// Enregistrer la locale française
countries.registerLocale(fr);

// Obtenir la liste des pays avec leurs codes ISO alpha-2
export function getCountriesList() {
  const countriesObj = countries.getNames("fr", { select: "official" });

  return Object.entries(countriesObj)
    .map(([code, label]) => ({
      value: code,
      label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Liste des pays avec la France et ses DOM en tête (FR, GF, MQ, GP),
 *  format `{ value, label }`. Utilisée par tous les formulaires client. */
export function getCountriesListWithPriority() {
  const all = getCountriesList();
  const priority = ["FR", "GF", "MQ", "GP"];
  const top = priority
    .map((code) => all.find((c) => c.value === code))
    .filter((x): x is { value: string; label: string } => !!x);
  const rest = all.filter((c) => !priority.includes(c.value));
  return [...top, ...rest];
}

// Vérifier si un code pays est valide
export function isValidCountryCode(code: string): boolean {
  return countries.isValid(code);
}

// Obtenir le nom d'un pays à partir de son code
export function getCountryName(code: string): string | undefined {
  return countries.getName(code, "fr", { select: "official" });
}
