"use client";

import { Label } from "@/components/ui/label";
import { DeleteButton } from "@/components/ui/delete-button";

interface Props {
  label: string;
  /** Tailwind utility class pour le fond derrière le logo (ex. `bg-neutral-800`
   *  pour montrer le rendu d'un logo clair, `bg-white` pour un logo foncé). */
  previewClass: string;
  url: string | null;
  uploading: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}

/** Champ d'upload d'une variante de logo (clair/foncé) avec preview sur
 *  un fond contrasté + bouton supprimer. Accepte PNG/JPG/WEBP/SVG. */
export function LogoField({
  label,
  previewClass,
  url,
  uploading,
  onPick,
  onRemove,
}: Props) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <div
          className={`rounded-md border border-gray-200 flex items-center justify-center overflow-hidden h-[100px] w-full sm:w-[150px] sm:shrink-0 ${previewClass}`}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Logo"
              className="max-w-full max-h-full object-contain p-2"
            />
          ) : (
            <span className="text-xs text-muted-foreground">Aucun</span>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <label
            className={`w-full sm:w-fit text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors inline-flex items-center justify-center ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {uploading ? "Envoi…" : "Choisir un fichier"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPick(f);
                e.target.value = "";
              }}
            />
          </label>
          {url && (
            <DeleteButton
              onClick={onRemove}
              disabled={uploading}
              className="w-full sm:w-fit"
            />
          )}
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP ou SVG — max 2 Mo (converti en PNG).
          </p>
        </div>
      </div>
    </div>
  );
}
