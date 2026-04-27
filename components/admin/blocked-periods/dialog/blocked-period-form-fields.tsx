"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { DatePickerButton } from "@/components/admin/shared/date-picker-button";
import type { Vehicle } from "@/domain/vehicle";
import type { BlockedPeriodFormValues } from "./blocked-period-schema";

interface Props {
  form: UseFormReturn<BlockedPeriodFormValues>;
  vehicles: Vehicle[];
}

/** Champs du formulaire d'indisponibilité : véhicule, dates début/fin,
 *  commentaire. Tous pilotés par `react-hook-form`. */
export function BlockedPeriodFormFields({ form, vehicles }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <>
      <Field label="Véhicule" error={errors.vehicleId?.message}>
        <Controller
          control={control}
          name="vehicleId"
          render={({ field }) => (
            <NativeSelect
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Sélectionner un véhicule"
              options={vehicles.map((v) => ({
                value: v.id,
                label: `${v.brand} ${v.model} — ${v.registrationPlate}`,
              }))}
            />
          )}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          control={control}
          name="start"
          render={({ field }) => (
            <Field label="Début" error={errors.start?.message}>
              <DatePickerButton
                value={field.value}
                onChange={field.onChange}
                placeholder="Sélectionner"
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="end"
          render={({ field }) => (
            <Field label="Fin" error={errors.end?.message}>
              <DatePickerButton
                value={field.value}
                onChange={field.onChange}
                placeholder="Sélectionner"
              />
            </Field>
          )}
        />
      </div>

      <Field label="Commentaire (optionnel)">
        <Textarea
          {...register("comment")}
          placeholder="Ex: Maintenance, contrôle technique..."
          rows={3}
        />
      </Field>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
