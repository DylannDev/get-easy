import "server-only";

/**
 * Convertit un buffer HEIC/HEIF en JPEG via `heic-convert` (libheif
 * compilé en WASM — pas de dépendance native, fonctionne sur n'importe
 * quel serveur Node).
 *
 * Utilisé comme pré-étape avant le pipeline sharp habituel : les photos
 * iPhone arrivent en HEIC, on les transforme en JPEG "universel" puis
 * sharp se charge du resize + recompression qualitative.
 */
export async function heicToJpeg(input: Buffer): Promise<Buffer> {
  // Import dynamique — `heic-convert` charge libheif.wasm au require,
  // on évite donc de l'initialiser tant qu'on n'en a pas besoin.
  const { default: convert } = await import("heic-convert");

  // Au runtime, `heic-decode` (utilisé par heic-convert) appelle
  // `.slice()` puis spread le résultat (`...array.slice(...)`) — il lui
  // faut donc un `Uint8Array` itérable, pas un `ArrayBuffer` brut (dont
  // `.slice()` retourne un autre ArrayBuffer non itérable).
  // Node `Buffer` étant un Uint8Array, on le passe tel quel en castant
  // pour satisfaire le typage (qui exige `ArrayBufferLike`).
  const output = await convert({
    buffer: input as unknown as ArrayBufferLike,
    format: "JPEG",
    // Qualité élevée : le JPEG sera ensuite recompressé par sharp, on ne
    // veut pas cumuler deux pertes. 0.95 ≈ quasi-lossless.
    quality: 0.95,
  });

  return Buffer.from(output);
}
