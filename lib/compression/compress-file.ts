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
import { heicToJpeg } from "./heic-to-jpeg";

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
  /**
   * Taille minimale (en octets) à partir de laquelle un PDF est compressé.
   * En dessous du seuil, le fichier est renvoyé tel quel (souvent déjà
   * bien optimisé ; la rasterisation ferait perdre en qualité pour un gain
   * marginal). Par défaut 0 → toujours compresser.
   */
  pdfMinSizeToCompress?: number;
}

const ACCEPTED_IMAGE = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  // HEIC / HEIF (iPhone, certains Samsung récents) — décodés par sharp
  // via libvips+heif. Convertis systématiquement en JPEG/PNG lisibles
  // partout (les navigateurs ne gèrent pas HEIC nativement).
  "image/heic",
  "image/heif",
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
    // HEIC/HEIF : sharp peut décoder via libvips+libheif natif, mais ce
    // dernier n'est pas toujours présent en prod. On passe d'abord par
    // `heic-convert` (WASM, zéro dépendance native) pour obtenir un JPEG
    // universel, puis on enchaîne le pipeline sharp habituel (resize +
    // recompression qualitative).
    const isHeic = mime === "image/heic" || mime === "image/heif";
    const bufferForSharp = isHeic ? await heicToJpeg(input) : input;
    const result = await compressImage(bufferForSharp, options.image);
    return {
      buffer: result.buffer,
      mimeType: result.mimeType,
      size: result.size,
      // Ratio toujours calculé par rapport au fichier d'origine (le HEIC),
      // pas au JPEG intermédiaire — c'est la vraie info utile au caller.
      ratio: result.size / input.byteLength,
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

    // Seuil : les PDFs en-dessous de `pdfMinSizeToCompress` octets sont
    // renvoyés tels quels (déjà optimisés en général).
    const threshold = options.pdfMinSizeToCompress ?? 0;
    if (input.byteLength <= threshold) {
      return {
        buffer: input,
        mimeType: "application/pdf",
        size: input.byteLength,
        ratio: 1,
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
