import "server-only";
import {
  compressImage,
  type CompressImageOptions,
} from "./compress-image";
import {
  compressPdf,
  pdfFirstPageToImage,
  type CompressPdfOptions,
} from "./compress-pdf";

export interface CompressFileResult {
  buffer: Buffer;
  mimeType: string;
  size: number;
  ratio: number;
  /** Conversion appliquée si pertinente. */
  converted?: { from: string; to: string };
}

export interface CompressFileOptions {
  image?: CompressImageOptions;
  pdf?: CompressPdfOptions;
  /**
   * Si TRUE, les PDFs sont rasterisés en image (1re page seulement) plutôt
   * que de rester en PDF. Utile quand la cible n'accepte que des images
   * (ex. embed dans `@react-pdf/renderer` via `<Image>`).
   */
  pdfToImage?: boolean;
}

const ACCEPTED_IMAGE = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

/**
 * Entrée unifiée de compression. Dispatch selon le mime-type d'entrée :
 *  - image (PNG/JPG/WEBP/SVG) → `compressImage`
 *  - PDF                       → `compressPdf` (ou rasterisation 1re page si `pdfToImage`)
 *
 * Renvoie systématiquement un Buffer, le mime-type final, la taille et le
 * ratio de compression. Idempotent (réappeler dessus ne dégrade pas davantage
 * — une image déjà compressée renverra ratio ≈ 1).
 */
export async function compressFile(
  input: Buffer,
  inputMimeType: string,
  options: CompressFileOptions = {}
): Promise<CompressFileResult> {
  const mime = inputMimeType.toLowerCase();

  if (ACCEPTED_IMAGE.includes(mime)) {
    const result = await compressImage(input, options.image);
    return {
      buffer: result.buffer,
      mimeType: result.mimeType,
      size: result.size,
      ratio: result.ratio,
      converted: mime !== result.mimeType ? { from: mime, to: result.mimeType } : undefined,
    };
  }

  if (mime === "application/pdf") {
    if (options.pdfToImage) {
      // Rasterisation 1re page → compression image
      const pageBuffer = await pdfFirstPageToImage(input, {
        dpi: 200,
      });
      const compressed = await compressImage(pageBuffer, options.image);
      return {
        buffer: compressed.buffer,
        mimeType: compressed.mimeType,
        size: compressed.size,
        ratio: compressed.size / input.byteLength,
        converted: { from: "application/pdf", to: compressed.mimeType },
      };
    }
    const result = await compressPdf(input, options.pdf);
    return {
      buffer: result.buffer,
      mimeType: "application/pdf",
      size: result.size,
      ratio: result.ratio,
    };
  }

  throw new Error(
    `Format non supporté pour la compression : ${inputMimeType}. Utilisez PNG, JPG, WEBP, SVG ou PDF.`
  );
}

export { compressImage, compressPdf, pdfFirstPageToImage };
