import "server-only";
import sharp from "sharp";

export interface CompressImageOptions {
  /** Largeur max en px (resize fit-inside, sans agrandir). */
  maxWidth?: number;
  /** Hauteur max en px. */
  maxHeight?: number;
  /** Qualité JPEG/WEBP (0-100). 85 = bon compromis qualité/poids. */
  quality?: number;
  /**
   * Format de sortie. "auto" (par défaut) :
   *   - PNG/SVG/WEBP avec alpha → PNG optimisé
   *   - sinon → JPEG (meilleure compression)
   */
  format?: "jpeg" | "png" | "webp" | "auto";
}

export interface CompressedImage {
  buffer: Buffer;
  mimeType: string;
  size: number;
  /** Ratio de compression (0..1, plus c'est petit, plus c'est compressé). */
  ratio: number;
}

const DEFAULT_OPTS: Required<CompressImageOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 85,
  format: "auto",
};

/**
 * Compresse une image (PNG, JPG, WEBP, SVG) via sharp.
 *
 * Stratégie :
 *  - Resize fit-inside sans agrandir (préserve la qualité originale si l'image
 *    est déjà petite).
 *  - JPEG mozjpeg (meilleure compression Huffman) à qualité 85 par défaut.
 *  - PNG : palette + zlib niveau 9 pour aplatir les couleurs si possible.
 *  - Auto-détection : on choisit JPEG si l'image n'a pas de canal alpha
 *    (gain de poids significatif), sinon PNG pour préserver la transparence.
 */
export async function compressImage(
  input: Buffer,
  options: CompressImageOptions = {}
): Promise<CompressedImage> {
  const opts = { ...DEFAULT_OPTS, ...options };
  const originalSize = input.byteLength;

  let pipeline = sharp(input, { failOn: "none" }).rotate(); // respecte EXIF
  pipeline = pipeline.resize({
    width: opts.maxWidth,
    height: opts.maxHeight,
    fit: "inside",
    withoutEnlargement: true,
  });

  // Décide du format de sortie.
  let outFormat: "jpeg" | "png" | "webp" = "jpeg";
  if (opts.format === "auto") {
    const meta = await sharp(input, { failOn: "none" }).metadata();
    outFormat = meta.hasAlpha ? "png" : "jpeg";
  } else {
    outFormat = opts.format;
  }

  let outBuffer: Buffer;
  let mimeType: string;
  switch (outFormat) {
    case "jpeg":
      outBuffer = await pipeline
        .jpeg({ quality: opts.quality, mozjpeg: true })
        .toBuffer();
      mimeType = "image/jpeg";
      break;
    case "png":
      outBuffer = await pipeline
        .png({ compressionLevel: 9, palette: true })
        .toBuffer();
      mimeType = "image/png";
      break;
    case "webp":
      outBuffer = await pipeline.webp({ quality: opts.quality }).toBuffer();
      mimeType = "image/webp";
      break;
  }

  // Si la version compressée est plus grosse que l'originale (rare mais
  // possible sur de très petites images déjà optimisées), on garde l'original.
  if (outBuffer.byteLength >= originalSize) {
    return {
      buffer: input,
      mimeType: mimeType,
      size: originalSize,
      ratio: 1,
    };
  }

  return {
    buffer: outBuffer,
    mimeType,
    size: outBuffer.byteLength,
    ratio: outBuffer.byteLength / originalSize,
  };
}
