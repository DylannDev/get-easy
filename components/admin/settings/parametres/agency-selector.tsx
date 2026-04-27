"use client";

import { NativeSelect } from "@/components/ui/native-select";
import { DeleteButton } from "@/components/ui/delete-button";
import type { Agency } from "@/domain/agency";

interface Props {
  agencies: Agency[];
  selectedAgencyId: string;
  onSelect: (id: string) => void;
  onDelete: () => void;
  /** La 1re agence ne peut pas être supprimée (agence "principale"). */
  isFirstAgency: boolean;
}

/** Sélecteur d'agence + bouton de suppression (sauf 1re agence). N'apparait
 *  que si `agencies.length > 1`. */
export function AgencySelector({
  agencies,
  selectedAgencyId,
  onSelect,
  onDelete,
  isFirstAgency,
}: Props) {
  if (agencies.length <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-[260px]">
        <NativeSelect
          value={selectedAgencyId}
          onValueChange={onSelect}
          options={agencies.map((a) => ({
            value: a.id,
            label: `${a.name} — ${a.city}`,
          }))}
        />
      </div>
      {!isFirstAgency && (
        <DeleteButton label="Supprimer l'agence" onClick={onDelete} />
      )}
    </div>
  );
}
