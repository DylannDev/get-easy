/**
 * Télécharge une image (URL publique) et la convertit en data URL base64 PNG
 * pour que `@react-pdf/renderer` l'intègre de manière fiable.
 *
 * Pour SVG et WEBP, on passe par `sharp` (import dynamique pour garder les
 * couches d'application testables sans la lib native). Pour PNG/JPG, passage
 * direct sans recompression.
 *
 * Retourne null si le téléchargement échoue ou si le format est inconnu.
 */
export async function fetchImageAsDataUrl(
  url: string | null | undefined
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType =
      res.headers.get("content-type")?.toLowerCase().split(";")[0] ?? "";
    const input = Buffer.from(await res.arrayBuffer());

    if (contentType === "image/png" || contentType === "image/jpeg") {
      return `data:${contentType};base64,${input.toString("base64")}`;
    }

    if (contentType === "image/svg+xml" || contentType === "image/webp") {
      const sharp = (await import("sharp")).default;
      const sharpInstance =
        contentType === "image/svg+xml"
          ? sharp(input, { density: 300 })
          : sharp(input);
      const png = await sharpInstance
        .resize({
          width: 800,
          height: 800,
          fit: "inside",
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
      return `data:image/png;base64,${png.toString("base64")}`;
    }

    console.warn(`[pdf] Unsupported image format: ${contentType}`);
    return null;
  } catch (e) {
    console.warn("[pdf] Failed to load image:", e);
    return null;
  }
}
