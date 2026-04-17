"use server";

import { z } from "zod";
import { createAdminClient } from "@/infrastructure/supabase/client";
import { compressFile } from "@/lib/compression/compress-file";
import { randomUUID } from "node:crypto";

const BUCKET = "customer-documents";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
// Seuil à partir duquel un PDF est recompressé (rasterisation iLovePDF-style).
// Sous ce seuil, on garde le PDF original : souvent déjà optimisé et la
// compression forte ferait perdre en netteté pour un gain marginal.
const PDF_COMPRESSION_THRESHOLD = 1 * 1024 * 1024; // 1 MB
const ACCEPTED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  // HEIC/HEIF : format par défaut des photos iPhone récents
  // (et certains Samsung). Convertis en JPEG par sharp pour être
  // lisibles partout (aperçu navigateur, OS, PDF embarqué…).
  "image/heic",
  "image/heif",
];

const typeSchema = z.enum(["driver_license", "id_card", "proof_of_address"]);

export interface StagedCustomerDocument {
  stagingKey: string;
  fileName: string;
  mimeType: string;
  size: number;
}

/**
 * Téléverse un document client en "staging" — accessible avant même que le
 * client existe en base. Utilisé depuis le tunnel de réservation public :
 * le client peut sélectionner ses pièces (permis, identité, justif de
 * domicile) avant de cliquer sur "Réserver et payer". À la soumission du
 * formulaire, les fichiers en staging sont déplacés vers leur emplacement
 * final et liés au `customer_id` + `booking_id` fraîchement créés.
 *
 * Flow :
 *   1. Client choisit un fichier → uploadStagedCustomerDocument(formData)
 *   2. Serveur : compresse (image/PDF), upload en staging, renvoie stagingKey
 *   3. Client garde la clé en state
 *   4. Client submit → createBookingAction(…, stagedDocuments: [{type, key}])
 *   5. Serveur : finalize (move vers orgId/customerId/type-ts.ext + insert row)
 */
export async function uploadStagedCustomerDocument(
  formData: FormData
): Promise<{
  ok: boolean;
  error?: string;
  staged?: StagedCustomerDocument;
}> {
  const file = formData.get("file");
  const typeRaw = formData.get("type");
  if (!(file instanceof File)) {
    return { ok: false, error: "Fichier manquant." };
  }
  if (file.size === 0) return { ok: false, error: "Fichier vide." };
  if (file.size > MAX_SIZE) {
    return { ok: false, error: "Fichier trop volumineux (max 10 Mo)." };
  }
  // Safari/iOS n'envoie pas toujours `file.type` pour les HEIC — on
  // replie sur l'extension dans ce cas.
  const resolvedMime = resolveMimeType(file.type, file.name);
  if (!resolvedMime || !ACCEPTED_MIME.includes(resolvedMime)) {
    return {
      ok: false,
      error: "Format de fichier non pris en charge. Utilisez un PDF ou une photo (JPG, PNG).",
    };
  }
  const typeParse = typeSchema.safeParse(typeRaw);
  if (!typeParse.success) {
    return { ok: false, error: "Type de document invalide." };
  }

  try {
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    // Images → sharp (qualité 88, 1600px max). HEIC/HEIF convertis en JPEG.
    // PDFs → conservés tels quels sous `PDF_COMPRESSION_THRESHOLD` (déjà
    // optimisés en général), rasterisés sinon (pipeline iLovePDF-style).
    const compressed = await compressFile(rawBuffer, resolvedMime, {
      // 1000px max sur la plus grande dimension, ratio préservé (sharp
      // `fit: "inside"` + `withoutEnlargement`). Valeur à ajuster selon
      // la lisibilité des pièces d'identité lors des tests réels.
      image: { maxWidth: 1000, maxHeight: 1000, quality: 88 },
      pdfMinSizeToCompress: PDF_COMPRESSION_THRESHOLD,
    });

    const stagingKey = `${randomUUID()}.${mimeToExt(compressed.mimeType)}`;
    const path = `staging/${stagingKey}`;

    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, compressed.buffer as Buffer | Uint8Array | ArrayBuffer, {
        contentType: compressed.mimeType,
        upsert: false,
      });
    if (uploadError) {
      console.error("[uploadStagedCustomerDocument] upload error:", uploadError);
      return {
        ok: false,
        error: "Impossible d'enregistrer le fichier. Merci de réessayer.",
      };
    }

    return {
      ok: true,
      staged: {
        stagingKey,
        fileName: file.name,
        mimeType: compressed.mimeType,
        size: compressed.size,
      },
    };
  } catch (e) {
    // On log l'erreur technique pour le debug serveur, mais on renvoie
    // au client un message neutre et actionable.
    console.error("[uploadStagedCustomerDocument] processing error:", e);
    return {
      ok: false,
      error: "Impossible de traiter ce fichier. Merci de réessayer ou d'utiliser un autre format (PDF, JPG, PNG).",
    };
  }
}

/**
 * Supprime un fichier en staging (si le client change d'avis avant de
 * soumettre le formulaire).
 */
export async function removeStagedCustomerDocument(
  stagingKey: string
): Promise<void> {
  if (!stagingKey) return;
  const supabase = createAdminClient();
  await supabase.storage.from(BUCKET).remove([`staging/${stagingKey}`]);
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

/**
 * Renvoie le mime-type effectif : si le navigateur n'en a pas fourni
 * (Safari/iOS oublie parfois pour HEIC), on déduit depuis l'extension
 * du nom de fichier.
 */
function resolveMimeType(mime: string, fileName: string): string | null {
  if (mime && mime !== "application/octet-stream") return mime.toLowerCase();
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    case "svg":
      return "image/svg+xml";
    default:
      return null;
  }
}
