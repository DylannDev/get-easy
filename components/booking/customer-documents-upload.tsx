"use client";

import { useState } from "react";
import { PiFilePdf, PiImage, PiCheck, PiX } from "react-icons/pi";
import {
  uploadStagedCustomerDocument,
  removeStagedCustomerDocument,
  type StagedCustomerDocument,
} from "@/actions/customer-documents";
import type { CustomerDocumentType } from "@/domain/customer-document";

export type StagedDocState = Partial<
  Record<
    CustomerDocumentType,
    (StagedCustomerDocument & { originalFileName: string }) | null
  >
>;

interface Props {
  value: StagedDocState;
  onChange: (next: StagedDocState) => void;
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
    help: "Recto-verso ou scan complet",
  },
  {
    type: "id_card",
    label: "Pièce d'identité",
    help: "Carte d'identité, passeport ou titre de séjour",
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

export function CustomerDocumentsUpload({ value, onChange }: Props) {
  return (
    <div className="rounded-xl border border-gray-300 bg-white p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Pièces jointes (facultatif)</h3>
        <p className="text-xs text-gray-500 mt-1">
          Gagnez du temps à la remise des clés en téléversant vos documents dès
          maintenant. Ils seront transmis de manière sécurisée à l&apos;agence.
        </p>
      </div>
      <div className="space-y-3">
        {SLOTS.map((slot) => (
          <Slot
            key={slot.type}
            slot={slot}
            staged={value[slot.type] ?? null}
            onStaged={(next) => onChange({ ...value, [slot.type]: next })}
          />
        ))}
      </div>
    </div>
  );
}

function Slot({
  slot,
  staged,
  onStaged,
}: {
  slot: SlotSpec;
  staged: (StagedCustomerDocument & { originalFileName: string }) | null;
  onStaged: (
    next: (StagedCustomerDocument & { originalFileName: string }) | null,
  ) => void;
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
      // Remplace l'éventuel précédent : on nettoie côté storage.
      if (staged?.stagingKey) {
        await removeStagedCustomerDocument(staged.stagingKey);
      }
      onStaged({ ...result.staged, originalFileName: file.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!staged) return;
    await removeStagedCustomerDocument(staged.stagingKey);
    onStaged(null);
    setError(null);
  };

  const isPdf = staged?.mimeType === "application/pdf";

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{slot.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{slot.help}</p>
        </div>
        {staged ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <PiCheck className="size-4" />
              Importé
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1 text-xs text-red-500 hover:underline"
            >
              <PiX className="size-3.5" />
              Supprimer
            </button>
          </div>
        ) : null}
      </div>

      {staged ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-700">
          {isPdf ? (
            <PiFilePdf className="size-4 text-red-500 shrink-0" />
          ) : (
            <PiImage className="size-4 text-blue-500 shrink-0" />
          )}
          <span className="truncate">{staged.originalFileName}</span>
        </div>
      ) : (
        <label
          className={`mt-2 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-gray-300 bg-white cursor-pointer hover:bg-gray-50 transition-colors ${
            uploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {uploading ? "Envoi…" : "Choisir un fichier"}
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
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
