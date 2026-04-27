"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import {
  handleDateInputChange,
  handleDateKeyDown,
} from "@/lib/format-date-input";
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
}

/** Bloc permis de conduire (numéro, date, pays). */
export function CustomerDriverLicenseFields({
  fields,
  setFields,
  errors,
  countryOptions,
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  return (
    <div className="space-y-4">
      <Field label="Numéro de permis" error={errors.driverLicenseNumber}>
        <Input
          name="driverLicenseNumber"
          value={fields.driverLicenseNumber}
          onChange={handleChange}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date d'obtention" error={errors.driverLicenseIssuedAt}>
          <Input
            name="driverLicenseIssuedAt"
            value={fields.driverLicenseIssuedAt}
            placeholder="JJ/MM/AAAA"
            maxLength={10}
            onChange={(e) =>
              handleDateInputChange(e, (val) =>
                setFields((prev) => ({ ...prev, driverLicenseIssuedAt: val })),
              )
            }
            onKeyDown={(e) =>
              handleDateKeyDown(e, (val) =>
                setFields((prev) => ({ ...prev, driverLicenseIssuedAt: val })),
              )
            }
            className={cn(errors.driverLicenseIssuedAt && "border-red-500")}
          />
        </Field>
        <NativeSelect
          id="driverLicenseCountry"
          label="Pays de délivrance"
          placeholder="Sélectionnez un pays"
          options={countryOptions}
          value={fields.driverLicenseCountry}
          onValueChange={(val) =>
            setFields((prev) => ({ ...prev, driverLicenseCountry: val }))
          }
          error={errors.driverLicenseCountry}
        />
      </div>
    </div>
  );
}
