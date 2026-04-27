"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  draft: { name: string; address: string; city: string };
  onUpdate: (patch: Partial<{ name: string; address: string; city: string }>) => void;
  isValid: boolean;
  onSubmit: () => void;
}

/** Dialog de création d'une agence (nom / adresse / ville). La validation
 *  et la soumission sont pilotées par `useAgencyCrud`. */
export function CreateAgencyDialog({
  open,
  onOpenChange,
  saving,
  draft,
  onUpdate,
  isValid,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle agence</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Nom de l'agence">
            <Input
              value={draft.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Mon agence"
              required
            />
          </Field>
          <Field label="Adresse">
            <Input
              value={draft.address}
              onChange={(e) => onUpdate({ address: e.target.value })}
              placeholder="123 rue de la Paix"
              required
            />
          </Field>
          <Field label="Ville">
            <Input
              value={draft.city}
              onChange={(e) => onUpdate({ city: e.target.value })}
              placeholder="Cayenne"
              required
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving || !isValid}
              onClick={onSubmit}
            >
              {saving ? "Création..." : "Créer l'agence"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
