"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { FUEL_LEVEL_LABELS } from "@/domain/inspection";
import type { FuelLevel } from "@/domain/inspection";

const FUEL_LEVELS: FuelLevel[] = ["empty", "1/4", "1/2", "3/4", "full"];

interface Props {
  mileage: string;
  setMileage: (v: string) => void;
  fuelLevel: FuelLevel | "";
  setFuelLevel: (v: FuelLevel | "") => void;
  notes: string;
  setNotes: (v: string) => void;
  disabled: boolean;
}

/** 3 champs de l'état des lieux : kilométrage, niveau de carburant, notes. */
export function InspectionFormFields({
  mileage,
  setMileage,
  fuelLevel,
  setFuelLevel,
  notes,
  setNotes,
  disabled,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Kilométrage">
        <Input
          type="number"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          placeholder="Ex. 45230"
          disabled={disabled}
        />
      </Field>
      <Field label="Niveau de carburant">
        <NativeSelect
          value={fuelLevel}
          onValueChange={(val) => setFuelLevel(val as FuelLevel | "")}
          disabled={disabled}
          placeholder="— Non renseigné —"
          options={FUEL_LEVELS.map((l) => ({
            value: l,
            label: FUEL_LEVEL_LABELS[l],
          }))}
        />
      </Field>
      <Field label="Commentaire général">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observations, dégâts constatés…"
          rows={1}
          disabled={disabled}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
