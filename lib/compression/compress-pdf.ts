import "server-only";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

export interface CompressPdfOptions {
  /** DPI de rasterisation (48 = miniature, 150 = print, 200 = haute déf). */
  dpi?: number;
  /** Qualité JPEG des images recompressées (0-100). */
  quality?: number;
}

export interface CompressedPdf {
  buffer: Buffer;
  size: number;
  ratio: number;
  pages: number;
}

const DEFAULT_OPTS: Required<CompressPdfOptions> = {
  dpi: 150,
  quality: 80,
};

/**
 * Compresse un PDF en :
 *  1. Rasterisant chaque page (via `pdf-to-img`) à un DPI raisonnable.
 *  2. Recompressant chaque page en JPEG avec sharp (mozjpeg).
 *  3. Recomposant un nouveau PDF (via `pdf-lib`) en embarquant les JPEGs.
 *
 * C'est l'approche utilisée par iLovePDF / Smallpdf en mode "compression
 * forte" : on perd la sélection de texte mais on obtient typiquement 80-90 %
 * de gain pour des PDFs majoritairement visuels (tampons, scans, fiches…).
 *
 * Pour des PDFs principalement texte où il faut conserver la sélection,
 * cette approche n'est PAS adaptée — utiliser ghostscript pour ce cas.
 */
export async function compressPdf(
  input: Buffer,
  options: CompressPdfOptions = {}
): Promise<CompressedPdf> {
  const opts = { ...DEFAULT_OPTS, ...options };
  const originalSize = input.byteLength;

  // Import dynamique : pdf-to-img est lourd, on évite de le charger si
  // l'utilitaire n'est pas appelé.
  const { pdf } = await import("pdf-to-img");
  // pdf-to-img attend un chemin OU un Uint8Array. Buffer extends Uint8Array.
  const document = await pdf(input, {
    scale: opts.dpi / 72, // 72 dpi = scale 1
  });

  const newPdf = await PDFDocument.create();
  let pageCount = 0;

  for await (const pageImage of document) {
    pageCount += 1;
    // pageImage est un PNG buffer → on le recompresse en JPEG via sharp.
    const jpeg = await sharp(pageImage)
      .jpeg({ quality: opts.quality, mozjpeg: true })
      .toBuffer();

    const meta = await sharp(jpeg).metadata();
    const w = meta.width ?? 595; // A4 width @ 72dpi
    const h = meta.height ?? 842;

    const embedded = await newPdf.embedJpg(jpeg);
    const page = newPdf.addPage([w, h]);
    page.drawImage(embedded, { x: 0, y: 0, width: w, height: h });
  }

  const out = await newPdf.save({ useObjectStreams: true });
  const outBuffer = Buffer.from(out);

  // Garde l'original si on n'a pas réussi à le compresser.
  if (outBuffer.byteLength >= originalSize) {
    return {
      buffer: input,
      size: originalSize,
      ratio: 1,
      pages: pageCount,
    };
  }

  return {
    buffer: outBuffer,
    size: outBuffer.byteLength,
    ratio: outBuffer.byteLength / originalSize,
    pages: pageCount,
  };
}

/**
 * Rasterise la première page d'un PDF en image PNG/JPEG (utile pour
 * embarquer un tampon PDF dans un autre PDF qui n'accepte que des images,
 * ex. notre template de contrat).
 */
export async function pdfFirstPageToImage(
  input: Buffer,
  options: { dpi?: number } = {}
): Promise<Buffer> {
  const dpi = options.dpi ?? 200; // haute déf pour signature/tampon
  const { pdf } = await import("pdf-to-img");
  const document = await pdf(input, { scale: dpi / 72 });

  for await (const pageImage of document) {
    return Buffer.from(pageImage);
  }
  throw new Error("PDF vide : impossible d'extraire la première page.");
}
