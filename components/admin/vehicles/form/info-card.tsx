"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  UseFormRegister,
  FieldErrors,
} from "react-hook-form";
import { Field } from "./field";
import type { VehicleFormInput } from "./vehicle-schema";

interface Props {
  register: UseFormRegister<VehicleFormInput>;
  errors: FieldErrors<VehicleFormInput>;
  isNew: boolean;
  qty: number;
  extraPlates: string[];
  extraPlateErrors: string[];
  onUpdatePlate: (index: number, value: string) => void;
}

/** Card "Informations générales" : marque, modèle, couleur, année,
 *  immatriculation principale + immatriculations additionnelles si l'utilisateur
 *  crée plusieurs véhicules d'un coup (quantity > 1). */
export function VehicleInfoCard({
  register,
  errors,
  isNew,
  qty,
  extraPlates,
  extraPlateErrors,
  onUpdatePlate,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informations générales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Marque" error={errors.brand?.message}>
            <Input {...register("brand")} placeholder="Renault" />
          </Field>
          <Field label="Modèle" error={errors.model?.message}>
            <Input {...register("model")} placeholder="Clio 5" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Couleur" error={errors.color?.message}>
            <Input {...register("color")} placeholder="Grise" />
          </Field>
          <Field label="Année" error={errors.year?.message}>
            <Input {...register("year")} type="number" placeholder="2024" />
          </Field>
        </div>
        <Field
          label={qty > 1 ? "Immatriculation (véhicule 1)" : "Immatriculation"}
          error={errors.registrationPlate?.message}
        >
          <Input
            {...register("registrationPlate")}
            placeholder="FZ-123-AC"
          />
        </Field>
        {isNew &&
          qty > 1 &&
          extraPlates.map((plate, i) => (
            <Field
              key={i}
              label={`Immatriculation (véhicule ${i + 2})`}
              error={extraPlateErrors[i]}
            >
              <Input
                value={plate}
                onChange={(e) => onUpdatePlate(i, e.target.value)}
                placeholder={`FZ-123-A${String.fromCharCode(68 + i)}`}
              />
            </Field>
          ))}
      </CardContent>
    </Card>
  );
}
