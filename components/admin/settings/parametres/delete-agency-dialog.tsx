"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyName: string | undefined;
  onConfirm: () => void;
}

/** Confirmation de suppression d'une agence. Toutes les données liées
 *  (véhicules, réservations, clients…) seront supprimées en cascade. */
export function DeleteAgencyDialog({
  open,
  onOpenChange,
  agencyName,
  onConfirm,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Supprimer l&apos;agence {agencyName} ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Toutes les données liées à cette
            agence seront supprimées (véhicules, réservations, clients, etc.).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-2 border-black text-black hover:text-green bg-transparent shadow-none">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={buttonVariants({ variant: "red" })}
          >
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
