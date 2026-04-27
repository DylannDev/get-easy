"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContractEditableFields } from "@/domain/contract";

export interface FieldDef {
  label: string;
  key: keyof ContractEditableFields;
  placeholder?: string;
}

/** `null` = cellule vide (sert à forcer le retour à la ligne d'un seul
 *  champ dans une grid 2-cols). */
type Slot = FieldDef | null;

interface Props {
  title: string;
  fields: ContractEditableFields;
  /** Groupes de champs : chaque groupe est une grid 2 colonnes, séparés par
   *  un trait horizontal (utilisé pour distinguer "infos véhicule" et
   *  "kilométrages/carburant départ-retour" dans la même card). */
  groups: Slot[][];
  onUpdate: <K extends keyof ContractEditableFields>(
    key: K,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Card générique du formulaire de contrat : `title` + une ou plusieurs
 *  grids 2-cols de champs `<Input />`. Évite de copier-coller la même
 *  structure JSX 4× pour Locataire/Véhicule/Durée/Divers. */
export function ContractFieldsCard({
  title,
  fields,
  groups,
  onUpdate,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {groups.map((defs, i) => (
          <div
            key={i}
            className={
              i === 0
                ? "grid gap-3 min-[1150px]:grid-cols-2"
                : "mt-4 grid gap-3 min-[1150px]:grid-cols-2 pt-4 border-t"
            }
          >
            {defs.map((def, j) =>
              def === null ? (
                <div key={`empty-${j}`} />
              ) : (
                <div key={def.key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {def.label}
                  </Label>
                  <Input
                    value={fields[def.key] ?? ""}
                    onChange={onUpdate(def.key)}
                    placeholder={def.placeholder}
                  />
                </div>
              ),
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
