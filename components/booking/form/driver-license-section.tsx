"use client";

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import {
  handleDateInputChange,
  handleDateKeyDown,
} from "@/lib/format-date-input";
import type { BookingFormData } from "@/lib/validations/booking";

interface Props {
  register: UseFormRegister<BookingFormData>;
  control: Control<BookingFormData>;
  errors: FieldErrors<BookingFormData>;
  countries: { value: string; label: string }[];
}

/** Section "Permis de conduire (facultatif)" : numéro, date d'obtention,
 *  pays d'obtention. Tous les champs sont optionnels côté schéma. */
export function DriverLicenseSection({
  register,
  control,
  errors,
  countries,
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">
        Informations permis de conduire (facultatif)
      </h3>

      <FormField
        id="driverLicenseNumber"
        label="Numéro de permis"
        {...register("driverLicenseNumber")}
        error={errors.driverLicenseNumber?.message}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="driverLicenseIssuedAt"
          control={control}
          render={({ field }) => (
            <FormField
              id="driverLicenseIssuedAt"
              label="Date d'obtention"
              type="text"
              placeholder="JJ/MM/AAAA"
              maxLength={10}
              value={field.value}
              onChange={(e) => handleDateInputChange(e, field.onChange)}
              onKeyDown={(e) => handleDateKeyDown(e, field.onChange)}
              onBlur={field.onBlur}
              error={errors.driverLicenseIssuedAt?.message}
            />
          )}
        />

        <Controller
          name="driverLicenseCountry"
          control={control}
          render={({ field }) => (
            <NativeSelect
              id="driverLicenseCountry"
              label="Pays d'obtention"
              placeholder="Sélectionnez un pays"
              options={countries}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.driverLicenseCountry?.message}
            />
          )}
        />
      </div>
    </div>
  );
}
