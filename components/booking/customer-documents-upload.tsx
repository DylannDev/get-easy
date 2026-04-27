"use client";

import { useState } from "react";
import { PiFilePdf, PiImage, PiX, PiPlus } from "react-icons/pi";
import {
  uploadStagedCustomerDocument,
  removeStagedCustomerDocument,
  type StagedCustomerDocument,
} from "@/actions/customer-documents";
import type { CustomerDocumentType } from "@/domain/customer-document";

export type StagedFile = StagedCustomerDocument & { originalFileName: string };

/** Multi-fichiers par type — ex. permis recto + verso dans le même slot. */
export type StagedDocState = Partial<
  Record<CustomerDocumentType, StagedFile[]>
>;

/** Payload attendu par les use cases pour matérialiser un fichier en staging
 *  vers la table customer_documents. */
export interface StagedDocumentPayload {
  stagingKey: string;
  type: CustomerDocumentType;
  fileName: string;
  mimeType: string;
  size: number;
}

/** Aplatie un `StagedDocState` (multi-fichiers par type) vers le payload
 *  consommé par les server actions / use cases. */
export function stagedDocsToPayload(
  state: StagedDocState,
): StagedDocumentPayload[] {
  return Object.entries(state)
    .filter(
      (entry): entry is [(typeof entry)[0], NonNullable<(typeof entry)[1]>] =>
        Array.isArray(entry[1]) && entry[1].length > 0,
    )
    .flatMap(([type, files]) =>
      files.map((staged) => ({
        stagingKey: staged.stagingKey,
        type: type as CustomerDocumentType,
        fileName: staged.originalFileName,
        mimeType: staged.mimeType,
        size: staged.size,
      })),
    );
}

interface Props {
  value: StagedDocState;
  onChange: (next: StagedDocState) => void;
  /** Masque l'en-tête (titre + texte d'aide). Utilisé côté admin où le
   *  contexte est déjà donné par le titre de la dialog. */
  hideHelp?: boolean;
}

interface SlotSpec {
  type: CustomerDocumentType;
  label: string;
  help: string;
}

const SLOTS: SlotSpec[] = [
  {
    type: "driver_license",
    label: "Permis de conduire",
    help: "Recto-verso (importez les 2 faces ou un PDF complet)",
  },
  {
    type: "id_card",
    label: "Pièce d'identité",
    help: "Carte d'identité, passeport ou titre de séjour (recto-verso)",
  },
  {
    type: "proof_of_address",
    label: "Justificatif de domicile",
    help: "Facture récente ou attestation",
  },
];

// HEIC/HEIF = photos iPhone par défaut. On accepte aussi `.heic`/`.heif`
// en extension car Safari/iOS n'envoie pas toujours le mime-type.
const ACCEPT =
  "application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif";

export function CustomerDocumentsUpload({ value, onChange, hideHelp }: Props) {
  // `min-w-0` propagé jusqu'à la racine — sinon, dans une dialog (qui est un
  // grid container par défaut côté shadcn), les grid tracks auto-sizent au
  // contenu et empêchent les `truncate` de fonctionner sur les noms de fichier.
  return (
    <div
      className={
        hideHelp
          ? "space-y-4 min-w-0"
          : "rounded-xl border border-gray-300 bg-white p-4 space-y-4 min-w-0"
      }
    >
      {!hideHelp && (
        <div>
          <h3 className="text-sm font-semibold">Pièces jointes (facultatif)</h3>
        </div>
      )}
      <div className="space-y-3 min-w-0">
        {SLOTS.map((slot) => (
          <Slot
            key={slot.type}
            slot={slot}
            files={value[slot.type] ?? []}
            onFilesChange={(next) => onChange({ ...value, [slot.type]: next })}
          />
        ))}
      </div>
    </div>
  );
}

function Slot({
  slot,
  files,
  onFilesChange,
}: {
  slot: SlotSpec;
  files: StagedFile[];
  onFilesChange: (next: StagedFile[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", slot.type);
      const result = await uploadStagedCustomerDocument(fd);
      if (!result.ok || !result.staged) {
        setError(result.error ?? "Échec du téléversement.");
        return;
      }
      onFilesChange([
        ...files,
        { ...result.staged, originalFileName: file.name },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (index: number) => {
    const target = files[index];
    if (!target) return;
    await removeStagedCustomerDocument(target.stagingKey);
    onFilesChange(files.filter((_, i) => i !== index));
    setError(null);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 min-w-0">
      <div>
        <p className="text-sm font-medium">
          {slot.label}
          {files.length > 0 && (
            <span className="ml-2 text-xs text-gray-500 font-normal">
              ({files.length} fichier{files.length > 1 ? "s" : ""})
            </span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{slot.help}</p>
      </div>

      {/* Liste des fichiers déjà importés */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((file, index) => {
            const isPdf = file.mimeType === "application/pdf";
            return (
              <li
                key={file.stagingKey}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-gray-200 bg-white px-2 py-1.5"
              >
                <div className="flex items-center gap-2 text-xs text-gray-700 min-w-0">
                  {isPdf ? (
                    <PiFilePdf className="size-4 text-red-500 shrink-0" />
                  ) : (
                    <PiImage className="size-4 text-blue-500 shrink-0" />
                  )}
                  <span className="truncate">{file.originalFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:underline shrink-0"
                >
                  <PiX className="size-3.5" />
                  Supprimer
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Bouton ajouter (label = "Choisir un fichier" si aucun, "+ Ajouter
          un fichier" sinon) */}
      <label
        className={`mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-gray-300 bg-white cursor-pointer hover:bg-gray-50 transition-colors ${
          uploading ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {files.length > 0 && <PiPlus className="size-3.5" />}
        {uploading
          ? "Envoi…"
          : files.length > 0
            ? "Ajouter un fichier"
            : "Choisir un fichier"}
        <input
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handlePick(f);
            e.target.value = "";
          }}
        />
      </label>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
