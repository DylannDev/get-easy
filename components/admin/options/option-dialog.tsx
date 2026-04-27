"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Option } from "@/domain/option";
import { useOptionForm } from "./dialog/use-option-form";
import { OptionFormFields } from "./dialog/option-form-fields";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  option: Option | null;
}

/** Dialog création/édition d'une option (admin). Tout le formulaire est
 *  géré par `useOptionForm` (react-hook-form + reset à l'ouverture +
 *  submit). Les champs sont rendus par `<OptionFormFields />`. */
export function OptionDialog({ open, onClose, onSaved, option }: Props) {
  const isEdit = !!option;
  const { form, saving, submit } = useOptionForm({ option, open, onSaved });

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
      key={option?.id ?? "new"}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'option" : "Nouvelle option"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <OptionFormFields form={form} />

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
