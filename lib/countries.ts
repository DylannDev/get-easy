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

// Vérifier si un code pays est valide
export function isValidCountryCode(code: string): boolean {
  return countries.isValid(code);
}

// Obtenir le nom d'un pays à partir de son code
export function getCountryName(code: string): string | undefined {
  return countries.getName(code, "fr", { select: "official" });
}
