"use server";

import { compressFile } from "@/lib/compression/compress-file";

const ACCEPTED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
];

const MAX_INPUT_SIZE = 3 * 1024 * 1024; // 3 MB

/**
 * Reçoit un fichier (image ou PDF), le compresse côté serveur et renvoie une
 * data URL prête à être stockée en BDD ou utilisée par `<Image>` dans un PDF.
 *
 * Pour les PDFs (ex. tampon scanné), on rasterise la 1re page et on
 * compresse en JPEG — c'est ce qui permet d'embarquer le tampon dans le
 * contrat PDF généré par `@react-pdf/renderer`, qui n'accepte pas de PDF
 * comme source `<Image>`.
 */
export async function compressUploadedSignature(
  formData: FormData
): Promise<{
  ok: boolean;
  error?: string;
  dataUrl?: string;
  mimeType?: string;
  originalSize?: number;
  compressedSize?: number;
}> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Fichier manquant." };
  }
  if (file.size === 0) return { ok: false, error: "Fichier vide." };
  if (file.size > MAX_INPUT_SIZE) {
    return {
      ok: false,
      error: "Fichier trop volumineux (max 3 Mo).",
    };
  }
  if (!ACCEPTED_MIME.includes(file.type)) {
    return {
      ok: false,
      error: `Format non supporté (${file.type}). Utilisez PNG, JPG, WEBP, SVG ou PDF.`,
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const compressed = await compressFile(buffer, file.type, {
      pdfToImage: true, // signature/tampon → toujours en image au final
      image: { maxWidth: 1200, maxHeight: 1200, quality: 88 },
    });

    const dataUrl = `data:${compressed.mimeType};base64,${compressed.buffer.toString("base64")}`;
    return {
      ok: true,
      dataUrl,
      mimeType: compressed.mimeType,
      originalSize: file.size,
      compressedSize: compressed.size,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur inconnue.",
    };
  }
}
