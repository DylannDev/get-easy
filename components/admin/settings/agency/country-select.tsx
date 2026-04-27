"use client";

import { NativeSelect } from "@/components/ui/native-select";
import { getCountriesList } from "@/lib/countries";

interface Props {
  value: string;
  onChange: (code: string) => void;
}

/** Select pays avec DOM-TOM + France métropole en tête. Spécifique aux
 *  paramètres agence (priorité différente du formulaire client). */
export function CountrySelect({ value, onChange }: Props) {
  const all = getCountriesList();
  const priority = ["FR", "GF", "MQ", "GP", "RE", "YT"];
  const top = priority
    .map((code) => all.find((c) => c.value === code))
    .filter(Boolean) as { value: string; label: string }[];
  const rest = all.filter((c) => !priority.includes(c.value));
  return (
    <NativeSelect
      value={value}
      onValueChange={onChange}
      options={[...top, ...rest]}
    />
  );
}
