"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { PiPlus, PiFilePdf } from "react-icons/pi";

/**
 * Boutons d'action de la page /admin/reservations.
 * Utilise `useTransition` pour afficher un overlay de chargement pendant
 * la navigation vers le wizard — sinon l'utilisateur clique sur un bouton
 * qui ne répond visuellement pas pendant ~1s (temps de charger le bundle
 * et les données serveur du wizard).
 */
export function ReservationsActions() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <>
      {pending && <ContentOverlay />}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => go("/admin/reservations/devis/nouveau")}
        >
          <PiFilePdf className="size-4" />
          Générer un devis
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={pending}
          onClick={() => go("/admin/reservations/nouvelle")}
        >
          <PiPlus className="size-4" />
          Nouvelle réservation
        </Button>
      </div>
    </>
  );
}
