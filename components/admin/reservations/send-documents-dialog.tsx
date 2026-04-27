"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { sendBookingDocuments } from "@/actions/admin/send-booking-documents";
import { toast } from "react-hot-toast";

export interface DocumentOption {
  id: string;
  label: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  defaultEmail: string;
  options: DocumentOption[];
}

export function SendDocumentsDialog({
  open,
  onOpenChange,
  bookingId,
  defaultEmail,
  options,
}: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  // Réinitialise les champs à chaque ouverture du dialog. Les setState sont
  // wrappés dans Promise.resolve().then() car React 19 Compiler interdit les
  // setState synchrones dans le body d'un effect.
  useEffect(() => {
    if (!open) return;
    Promise.resolve().then(() => {
      setEmail(defaultEmail);
      setSelected(new Set(options.map((o) => o.id)));
    });
  }, [open, defaultEmail, options]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) {
      toast.error("Sélectionnez au moins un document.");
      return;
    }
    if (!email.trim()) {
      toast.error("L'adresse email est requise.");
      return;
    }

    setSending(true);
    try {
      const labelOverrides = Object.fromEntries(
        options.filter((o) => selected.has(o.id)).map((o) => [o.id, o.label]),
      );
      const result = await sendBookingDocuments({
        bookingId,
        documentIds: Array.from(selected),
        recipientEmail: email.trim(),
        labelOverrides,
      });
      if (result.ok) {
        toast.success("Email envoyé avec succès.");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Échec de l'envoi.");
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Une erreur inattendue est survenue.",
      );
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Envoyer les documents par email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Destinataire
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Documents à joindre
            </Label>
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun document disponible pour cette réservation.
              </p>
            ) : (
              <div className="space-y-2">
                {options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center gap-2 rounded-md p-1 hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selected.has(opt.id)}
                      onCheckedChange={() => toggle(opt.id)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSend}
            disabled={sending || options.length === 0}
          >
            {sending ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
