"use client";

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import {
  handleDateInputChange,
  handleDateKeyDown,
} from "@/lib/format-date-input";
import type { BookingFormData } from "@/lib/validations/booking";

interface Props {
  register: UseFormRegister<BookingFormData>;
  control: Control<BookingFormData>;
  errors: FieldErrors<BookingFormData>;
}

/** Section "Informations générales" : prénom, nom, email, téléphone,
 *  date + lieu de naissance. */
export function PersonalInfoSection({ register, control, errors }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">
        Informations générales
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="firstName"
          label="Prénom"
          placeholder="John"
          required
          {...register("firstName")}
          error={errors.firstName?.message}
        />
        <FormField
          id="lastName"
          label="Nom"
          placeholder="Doe"
          required
          {...register("lastName")}
          error={errors.lastName?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="email"
          label="Email"
          type="email"
          placeholder="john.doe@example.com"
          required
          {...register("email")}
          error={errors.email?.message}
        />
        <div className="flex flex-col">
          <label htmlFor="phone" className="text-sm font-medium mb-1">
            Téléphone <span className="text-red-500">*</span>
          </label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                {...field}
                id="phone"
                placeholder="Entrez votre numéro de téléphone"
                className={cn(errors.phone && "border-red-500", "phone-input")}
              />
            )}
          />
          {errors.phone && (
            <p className="text-xs text-red-600 mt-2">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="birthDate"
          control={control}
          render={({ field }) => (
            <FormField
              id="birthDate"
              label="Date de naissance"
              type="text"
              placeholder="JJ/MM/AAAA"
              maxLength={10}
              required
              value={field.value}
              onChange={(e) => handleDateInputChange(e, field.onChange)}
              onKeyDown={(e) => handleDateKeyDown(e, field.onChange)}
              onBlur={field.onBlur}
              error={errors.birthDate?.message}
            />
          )}
        />
        <FormField
          id="birthPlace"
          label="Lieu de naissance"
          placeholder="Cayenne"
          {...register("birthPlace")}
          error={errors.birthPlace?.message}
        />
      </div>
    </div>
  );
}
