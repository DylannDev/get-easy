"use client";

import Link from "next/link";

interface Props {
  value: string | null;
}

/** Affichage en lecture seule de la signature/tampon du loueur. Aligné sur
 *  les dimensions du canvas du locataire (`SignaturePad`). Lien vers Infos
 *  agence pour modifier. */
export function LoueurSignatureDisplay({ value }: Props) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground">Loueur</span>
      <div className="flex items-center justify-center w-full h-[400px] rounded-md border border-gray-200 bg-white overflow-hidden">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Signature / tampon du loueur"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center px-4">
            <p className="text-xs text-muted-foreground mb-2">
              Aucune signature/tampon configuré pour cette agence.
            </p>
            <Link
              href="/admin/infos-agence"
              className="text-xs text-black underline hover:no-underline"
            >
              Ajouter une signature dans Infos agence
            </Link>
          </div>
        )}
      </div>
      {value && (
        <Link
          href="/admin/infos-agence"
          className="text-xs text-muted-foreground underline hover:no-underline self-start inline-block"
        >
          Modifier dans Infos agence
        </Link>
      )}
    </div>
  );
}
