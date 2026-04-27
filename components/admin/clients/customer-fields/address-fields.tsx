"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { Field } from "./field";
import type {
  CountryOption,
  CustomerFieldsValue,
  Errors,
  SetState,
} from "./types";

interface Props {
  fields: CustomerFieldsValue;
  setFields: SetState<CustomerFieldsValue>;
  errors: Errors;
  countryOptions: CountryOption[];
  showPlaceholders?: boolean;
  /** En mode "lite" (devis) : aucun champ d'adresse n'est marqué obligatoire. */
  liteMode?: boolean;
}

/** Bloc adresse (rue, complément, CP, ville, pays). */
export function CustomerAddressFields({
  fields,
  setFields,
  errors,
  countryOptions,
  showPlaceholders = false,
  liteMode = false,
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  return (
    <div className="space-y-4">
      <Field label="Adresse" required={!liteMode} error={errors.address}>
        <Input
          name="address"
          value={fields.address}
          onChange={handleChange}
          placeholder={showPlaceholders ? "123 rue de la Paix" : undefined}
          className={cn(errors.address && "border-red-500")}
        />
      </Field>
      <Field label="Complément d'adresse" error={errors.address2}>
        <Input
          name="address2"
          value={fields.address2}
          onChange={handleChange}
          placeholder={
            showPlaceholders ? "Appartement, bâtiment, étage" : undefined
          }
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Code postal"
          required={!liteMode}
          error={errors.postalCode}
        >
          <Input
            name="postalCode"
            value={fields.postalCode}
            onChange={handleChange}
            placeholder={showPlaceholders ? "97300" : undefined}
            className={cn(errors.postalCode && "border-red-500")}
          />
        </Field>
        <Field label="Ville" required={!liteMode} error={errors.city}>
          <Input
            name="city"
            value={fields.city}
            onChange={handleChange}
            placeholder={showPlaceholders ? "Cayenne" : undefined}
            className={cn(errors.city && "border-red-500")}
          />
        </Field>
      </div>
      <NativeSelect
        id="country"
        label="Pays"
        required={!liteMode}
        placeholder="Sélectionnez un pays"
        options={countryOptions}
        value={fields.country}
        onValueChange={(val) =>
          setFields((prev) => ({ ...prev, country: val }))
        }
        error={errors.country}
      />
    </div>
  );
}
