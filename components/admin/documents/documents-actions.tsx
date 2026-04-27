"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { PiFilePdf } from "react-icons/pi";

/**
 * Bouton "Générer un devis" pour la page /admin/documents.
 * Réutilise le wizard existant via `?from=documents` afin que la redirection
 * post-génération revienne sur l'onglet Devis de la page documents.
 */
export function DocumentsActions() {
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          disabled={pending}
          onClick={() => go("/admin/reservations/devis/nouveau?from=documents")}
        >
          <PiFilePdf className="size-4" />
          Générer un devis
        </Button>
      </div>
    </>
  );
}
