"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Controller, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { Field } from "./field";
import type { VehicleFormInput } from "./vehicle-schema";

interface Props {
  register: UseFormRegister<VehicleFormInput>;
  control: Control<VehicleFormInput>;
  errors: FieldErrors<VehicleFormInput>;
  onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Card "Caractéristiques" : transmission/carburant/places/portes/quantité +
 *  taille coffre + puissance fiscale + prix de base. */
export function VehicleFeaturesCard({
  register,
  control,
  errors,
  onQuantityChange,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Caractéristiques</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Transmission">
            <Controller
              control={control}
              name="transmission"
              render={({ field }) => (
                <NativeSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { value: "manuelle", label: "Manuelle" },
                    { value: "automatique", label: "Automatique" },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Carburant">
            <Controller
              control={control}
              name="fuelType"
              render={({ field }) => (
                <NativeSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { value: "essence", label: "Essence" },
                    { value: "diesel", label: "Diesel" },
                    { value: "électrique", label: "Électrique" },
                    { value: "hybride", label: "Hybride" },
                  ]}
                />
              )}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Places" error={errors.numberOfSeats?.message}>
            <Input
              {...register("numberOfSeats")}
              type="number"
              placeholder="5"
            />
          </Field>
          <Field label="Portes" error={errors.numberOfDoors?.message}>
            <Input
              {...register("numberOfDoors")}
              type="number"
              placeholder="5"
            />
          </Field>
          <Field label="Quantité" error={errors.quantity?.message}>
            <Input
              {...register("quantity")}
              type="number"
              placeholder="1"
              onChange={onQuantityChange}
            />
          </Field>
        </div>
        <Field label="Taille du coffre" error={errors.trunkSize?.message}>
          <Input {...register("trunkSize")} placeholder="5 Bagages" />
        </Field>
        <Field label="Puissance fiscale (CV)" error={errors.fiscalPower?.message}>
          <Input
            {...register("fiscalPower")}
            type="number"
            min="0"
            max="99"
            placeholder="5"
          />
        </Field>
        <Field label="Prix de base / jour (€)" error={errors.pricePerDay?.message}>
          <Input
            {...register("pricePerDay")}
            type="number"
            placeholder="45"
          />
        </Field>
      </CardContent>
    </Card>
  );
}
