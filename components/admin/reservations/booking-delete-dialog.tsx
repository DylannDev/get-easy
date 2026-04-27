"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteBookingAction } from "@/actions/admin/booking-delete";
import { cn } from "@/lib/utils";
import { normalizeForCompare } from "@/lib/string";
import { toast } from "react-hot-toast";
import { PiWarning } from "react-icons/pi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  /** Nom complet à re-taper pour confirmer (insensible à la casse). */
  customerName: string;
}

export function BookingDeleteDialog({
  open,
  onOpenChange,
  bookingId,
  customerName,
}: Props) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Réinitialise à chaque ouverture (setState wrappé pour React 19 Compiler).
  useEffect(() => {
    if (!open) return;
    Promise.resolve().then(() => setTyped(""));
  }, [open]);

  const matches =
    normalizeForCompare(typed) === normalizeForCompare(customerName);

  const handleDelete = async () => {
    if (!matches) return;
    setDeleting(true);
    try {
      const result = await deleteBookingAction(bookingId);
      if (result.ok) {
        toast.success("Réservation supprimée.");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Échec de la suppression.");
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Une erreur inattendue est survenue.",
      );
    }
    setDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer la réservation ?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-1">
            <p className="font-medium flex items-center gap-2">
              <PiWarning className="size-4 shrink-0" />
              Action irréversible
            </p>
            <p className="text-xs">
              La réservation, ses options, paiements, factures, contrats et
              états des lieux (PDFs + photos) seront définitivement supprimés.
              Les pièces jointes du client (permis, ID…) restent attachées au
              client.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs">
              Pour confirmer, tapez{" "}
              <span className="font-semibold">&quot;{customerName}&quot;</span>{" "}
              dans le champ ci-dessous.
            </p>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Annuler
          </Button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || !matches}
            className={cn(
              buttonVariants({ variant: "red", size: "sm" }),
              (deleting || !matches) &&
                "opacity-50 cursor-not-allowed pointer-events-none",
            )}
          >
            {deleting ? "Suppression…" : "Supprimer définitivement"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
