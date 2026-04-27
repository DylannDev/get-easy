"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Field } from "./field";
import type { OptionFormValues } from "./option-schema";

interface Props {
  form: UseFormReturn<OptionFormValues>;
}

/** Bloc "Plafonner le prix mensuel" — affiché uniquement si `priceType` est
 *  "per_day" (un forfait n'a pas de notion mensuelle). Le sous-bloc plafond
 *  ne s'ouvre que si la case est cochée. */
export function CapSection({ form }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const priceType = useWatch({ control, name: "priceType" });
  const capEnabled = useWatch({ control, name: "capEnabled" });

  if (priceType !== "per_day") return null;

  return (
    <div className="space-y-2 rounded-md border border-gray-200 p-3 bg-gray-50">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...register("capEnabled")}
          className="size-4 rounded border-gray-300"
        />
        <span className="text-sm font-medium">Plafonner le prix mensuel</span>
      </label>
      {capEnabled && (
        <>
          <Field
            label="Plafond mensuel (€)"
            error={errors.monthlyCap?.message}
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex : 50,00"
              {...register("monthlyCap", {
                setValueAs: (v) =>
                  v === "" || v === null ? null : Number(v),
              })}
            />
          </Field>
          <p className="text-[11px] text-muted-foreground">
            Appliqué par tranche de 30 jours entamée. Exemple : 35 jours de
            location = 2 mois entamés → montant max 2 × plafond.
          </p>
        </>
      )}
    </div>
  );
}
