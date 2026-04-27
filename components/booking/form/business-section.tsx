"use client";

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import type { BookingFormData } from "@/lib/validations/booking";

interface Props {
  register: UseFormRegister<BookingFormData>;
  control: Control<BookingFormData>;
  errors: FieldErrors<BookingFormData>;
  isBusiness: boolean;
}

/** Section "Je suis un professionnel" du formulaire public : toggle B2B
 *  qui révèle 3 champs supplémentaires (companyName, siret, vatNumber). */
export function BusinessSection({
  register,
  control,
  errors,
  isBusiness,
}: Props) {
  return (
    <div className="space-y-4">
      <Controller
        name="isBusiness"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <span className="text-sm font-medium">Je suis un professionnel</span>
          </label>
        )}
      />
      {isBusiness && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <FormField
            id="companyName"
            label="Nom de l'entreprise"
            placeholder="Acme SAS"
            required
            {...register("companyName")}
            error={errors.companyName?.message}
            className="bg-white"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="siret"
              label="N° SIRET"
              placeholder="12345678900012"
              required
              {...register("siret")}
              error={errors.siret?.message}
              className="bg-white"
            />
            <FormField
              id="vatNumber"
              label="N° TVA intracommunautaire"
              placeholder="FR12345678900"
              {...register("vatNumber")}
              error={errors.vatNumber?.message}
              className="bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
