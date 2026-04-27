"use client";

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import type { BookingFormData } from "@/lib/validations/booking";

interface Props {
  register: UseFormRegister<BookingFormData>;
  control: Control<BookingFormData>;
  errors: FieldErrors<BookingFormData>;
  countries: { value: string; label: string }[];
}

/** Section "Adresse de facturation" : rue, complément, CP, ville, pays. */
export function AddressSection({
  register,
  control,
  errors,
  countries,
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">
        Adresse de facturation
      </h3>

      <FormField
        id="address"
        label="Adresse"
        placeholder="123 Rue de la Paix"
        required
        {...register("address")}
        error={errors.address?.message}
      />

      <FormField
        id="address2"
        label="Complément d'adresse"
        placeholder="Appartement, bâtiment, étage"
        {...register("address2")}
        error={errors.address2?.message}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="postalCode"
          label="Code postal"
          placeholder="97300"
          required
          {...register("postalCode")}
          error={errors.postalCode?.message}
        />
        <FormField
          id="city"
          label="Ville"
          placeholder="Cayenne"
          required
          {...register("city")}
          error={errors.city?.message}
        />
      </div>

      <Controller
        name="country"
        control={control}
        render={({ field }) => (
          <NativeSelect
            id="country"
            label="Pays"
            required
            placeholder="Sélectionnez un pays"
            options={countries}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.country?.message}
          />
        )}
      />
    </div>
  );
}
