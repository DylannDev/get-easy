"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BlockedPeriodWithVehicle } from "@/actions/admin/blocked-periods";
import type { Vehicle } from "@/domain/vehicle";
import { useBlockedPeriodForm } from "./dialog/use-blocked-period-form";
import { BlockedPeriodFormFields } from "./dialog/blocked-period-form-fields";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  period: BlockedPeriodWithVehicle | null;
  vehicles: Vehicle[];
}

/** Dialog création/édition d'une indisponibilité véhicule. La logique du
 *  formulaire est dans `useBlockedPeriodForm` (react-hook-form + Zod), le
 *  rendu des champs dans `<BlockedPeriodFormFields />`. */
export function BlockedPeriodDialog({
  open,
  onClose,
  onSaved,
  period,
  vehicles,
}: Props) {
  const isEdit = !!period;
  const { form, saving, submit } = useBlockedPeriodForm({
    open,
    period,
    onSaved,
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
      key={period?.id ?? "new"}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'indisponibilité" : "Nouvelle indisponibilité"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <BlockedPeriodFormFields form={form} vehicles={vehicles} />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving
                ? "Enregistrement..."
                : isEdit
                  ? "Enregistrer"
                  : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
