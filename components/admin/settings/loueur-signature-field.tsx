"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/components/admin/contracts/signature-pad";
import { PiEraser, PiUploadSimple, PiPencil } from "react-icons/pi";
import { compressUploadedSignature } from "@/actions/admin/compress-signature";
import { saveAgencySignature } from "@/actions/admin/agency-details";

interface Props {
  agencyId: string;
  value: string | null;
}

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB
const ACCEPTED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
];

/**
 * Champ d'édition de la signature / tampon du Loueur, **auto-sauvegardée**
 * (comme le logo). L'utilisateur n'a pas besoin de cliquer sur le bouton
 * global "Enregistrer" du formulaire agence pour persister la signature.
 *
 * Deux modes : dessiner (canvas) ou importer (image / PDF).
 */
export function LoueurSignatureField({ agencyId, value }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState<string | null>(value);
  const [mode, setMode] = useState<"draw" | "upload">(() =>
    value ? "upload" : "draw",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const persist = async (dataUrl: string | null) => {
    setBusy(true);
    try {
      await saveAgencySignature(agencyId, dataUrl);
      setCurrent(dataUrl);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de sauvegarde.");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    if (!ACCEPTED_MIME.includes(file.type)) {
      setError("Utilisez PNG, JPG, WEBP, SVG ou PDF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Fichier trop volumineux (max 3 Mo).");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await compressUploadedSignature(fd);
      if (!result.ok || !result.dataUrl) {
        setError(result.error ?? "Échec du téléversement.");
        return;
      }
      await persist(result.dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setBusy(false);
    }
  };

  const handleDrawChange = (dataUrl: string | null) => {
    // Auto-save dès qu'un trait est terminé ou effacé.
    persist(dataUrl);
  };

  const handleClear = () => {
    setError(null);
    persist(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMode("draw")}
          className={
            mode === "draw"
              ? "bg-black text-green hover:bg-black hover:text-green"
              : ""
          }
        >
          <PiPencil className="size-4" />
          Dessiner
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMode("upload")}
          className={
            mode === "upload"
              ? "bg-black text-green hover:bg-black hover:text-green"
              : ""
          }
        >
          <PiUploadSimple className="size-4" />
          Importer
        </Button>
        {current && (
          <button
            type="button"
            onClick={handleClear}
            disabled={busy}
            className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:underline disabled:opacity-50"
          >
            <PiEraser className="size-3.5" />
            Supprimer
          </button>
        )}
      </div>

      {mode === "draw" ? (
        <div className="max-w-md">
          <SignaturePad
            label="Signature / tampon par défaut"
            initialValue={current}
            onChange={handleDrawChange}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start gap-4">
            <div
              className="shrink-0 rounded-md border border-gray-200 bg-white flex items-center justify-center overflow-hidden"
              style={{ width: 240, height: 160 }}
            >
              {current ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current}
                  alt="Signature / tampon"
                  className="max-w-full max-h-full object-contain p-2"
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  Aucun fichier
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <label
                className={`text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors inline-block w-fit ${
                  busy ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {busy ? "Envoi…" : "Choisir un fichier"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <p className="text-xs text-muted-foreground max-w-xs">
                PNG, JPG, WEBP, SVG ou PDF — max 3 Mo.
              </p>
            </div>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
