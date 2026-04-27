"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "./field";
import { CapSection } from "./cap-section";
import type { OptionFormValues } from "./option-schema";

interface Props {
  form: UseFormReturn<OptionFormValues>;
}

/** Champs du formulaire option : nom, description, type tarif, prix,
 *  quantité max, ordre, plafond mensuel (conditionnel), actif. */
export function OptionFormFields({ form }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <>
      <Field label="Nom" error={errors.name?.message}>
        <Input
          {...register("name")}
          placeholder="Ex: Siège bébé, GPS, Conducteur supplémentaire…"
        />
      </Field>

      <Field
        label="Description (optionnelle)"
        error={errors.description?.message}
      >
        <Textarea
          {...register("description")}
          rows={2}
          placeholder="Courte description visible par le client"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Type de tarif" error={errors.priceType?.message}>
          <Controller
            control={control}
            name="priceType"
            render={({ field }) => (
              <NativeSelect
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { value: "per_day", label: "Par jour" },
                  { value: "flat", label: "Forfait (unique)" },
                ]}
              />
            )}
          />
        </Field>
        <Field label="Prix (€)" error={errors.price?.message}>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register("price", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Quantité max" error={errors.maxQuantity?.message}>
          <Input
            type="number"
            min="1"
            max="99"
            {...register("maxQuantity", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Ordre d'affichage" error={errors.sortOrder?.message}>
          <Input
            type="number"
            min="0"
            {...register("sortOrder", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <CapSection form={form} />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...register("active")}
          className="size-4 rounded border-gray-300"
        />
        <span className="text-sm">Option active (proposée aux clients)</span>
      </label>
    </>
  );
}
