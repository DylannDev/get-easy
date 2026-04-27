"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PiCopy } from "react-icons/pi";

interface Props {
  isNew: boolean;
  qty: number;
  saving: boolean;
  deleting: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
}

/** Bandeau d'actions en pied de formulaire véhicule : Supprimer +
 *  Dupliquer (édition uniquement) à gauche, Submit à droite. La suppression
 *  est confirmée par AlertDialog. */
export function VehicleFormActions({
  isNew,
  qty,
  saving,
  deleting,
  onDelete,
  onDuplicate,
}: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {!isNew && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DeleteButton
                  className="w-full sm:w-auto"
                  disabled={deleting}
                  label={deleting ? "Suppression..." : "Supprimer"}
                />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce véhicule ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le véhicule sera
                    définitivement supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-2 border-black text-black hover:text-green bg-transparent shadow-none">
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className={buttonVariants({ variant: "red" })}
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
              onClick={onDuplicate}
            >
              <PiCopy className="size-4" />
              Dupliquer
            </Button>
          </>
        )}
      </div>
      <Button
        type="submit"
        disabled={saving}
        size="sm"
        className="w-full sm:w-auto"
      >
        {saving
          ? "Enregistrement..."
          : isNew
            ? qty > 1
              ? `Créer ${qty} véhicules`
              : "Créer le véhicule"
            : "Enregistrer"}
      </Button>
    </div>
  );
}
