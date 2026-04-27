"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BookingStatusBadge } from "@/components/admin/shared/booking-status-badge";
import { updateBookingStatus } from "@/actions/admin/booking-status";
import { BookingStatus } from "@/domain/booking";
import { toast } from "react-hot-toast";

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: BookingStatus.Paid, label: "Confirmée (payée)" },
  { value: BookingStatus.PendingPayment, label: "En attente de paiement" },
  { value: BookingStatus.PaymentFailed, label: "Échec paiement" },
  { value: BookingStatus.Cancelled, label: "Annulée" },
  { value: BookingStatus.Refunded, label: "Remboursée" },
  { value: BookingStatus.Expired, label: "Expirée" },
  { value: BookingStatus.Initiated, label: "Initiée" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  currentStatus: BookingStatus;
}

export function BookingStatusChangeDialog({
  open,
  onOpenChange,
  bookingId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<BookingStatus>(currentStatus);
  const [saving, setSaving] = useState(false);

  // Réinitialise sur le statut courant à chaque ouverture (setState wrappé
  // pour React 19 Compiler).
  useEffect(() => {
    if (!open) return;
    Promise.resolve().then(() => setSelected(currentStatus));
  }, [open, currentStatus]);

  const handleConfirm = async () => {
    if (selected === currentStatus) {
      onOpenChange(false);
      return;
    }
    setSaving(true);
    try {
      const result = await updateBookingStatus({
        bookingId,
        newStatus: selected,
      });
      if (result.ok) {
        toast.success("Statut mis à jour.");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Échec de la mise à jour.");
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Une erreur inattendue est survenue."
      );
    }
    setSaving(false);
  };

  const willGenerateInvoice =
    selected === BookingStatus.Paid && currentStatus !== BookingStatus.Paid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changer le statut de la réservation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Statut actuel :</span>
            <BookingStatusBadge status={currentStatus} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Nouveau statut
            </Label>
            <div className="grid grid-cols-1 gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                    selected === opt.value
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    checked={selected === opt.value}
                    onChange={() => setSelected(opt.value)}
                    className="size-4 cursor-pointer"
                  />
                  <BookingStatusBadge status={opt.value} />
                  <span className="text-sm text-muted-foreground">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {willGenerateInvoice && (
            <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
              💡 Une facture sera automatiquement générée lors du passage à
              <strong> Confirmée</strong>.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={saving || selected === currentStatus}
          >
            {saving ? "Mise à jour…" : "Confirmer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
