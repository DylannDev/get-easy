"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/composition-root/container";
import { compressFile } from "@/lib/compression/compress-file";
import { randomUUID } from "node:crypto";
import type { InspectionType, FuelLevel } from "@/domain/inspection";

// ─── Upsert report (km, carburant, commentaire) ────────────────────

interface SaveReportInput {
  bookingId: string;
  type: InspectionType;
  mileage?: number | null;
  fuelLevel?: FuelLevel | null;
  notes?: string | null;
}

export async function saveInspectionReport(
  input: SaveReportInput
): Promise<{ ok: boolean; reportId?: string; error?: string }> {
  try {
    const { inspectionRepository } = getContainer();
    const report = await inspectionRepository.upsert(input);
    revalidatePath(`/admin/reservations/${input.bookingId}`);
    return { ok: true, reportId: report.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur inconnue.",
    };
  }
}

// ─── Upload photo ───────────────────────────────────────────────────

const MAX_PHOTO_SIZE = 15 * 1024 * 1024; // 15 MB (photos tablette haute résolution)

export async function uploadInspectionPhoto(
  formData: FormData
): Promise<{
  ok: boolean;
  photo?: {
    id: string;
    signedUrl: string;
  };
  error?: string;
}> {
  const file = formData.get("file");
  const reportId = formData.get("reportId") as string;
  const bookingId = formData.get("bookingId") as string;
  const agencyId = formData.get("agencyId") as string;
  const note = (formData.get("note") as string) || null;
  const sortOrder = Number(formData.get("sortOrder")) || 0;

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Fichier manquant." };
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return { ok: false, error: "Fichier trop volumineux (max 15 Mo)." };
  }

  try {
    const { inspectionRepository, agencyRepository } = getContainer();

    // Compression : resize 1600px (photos EDL gardées plus grandes que
    // les documents clients pour voir les détails des dommages) + JPEG q88.
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const resolvedMime = file.type || "image/jpeg";
    const compressed = await compressFile(rawBuffer, resolvedMime, {
      image: { maxWidth: 1600, maxHeight: 1600, quality: 88 },
    });

    // Build storage path : {org}/{agency}/inspection/{bookingId}/{uuid}.{ext}
    const agency = await agencyRepository.findById(agencyId);
    const orgId = agency?.organizationId ?? "unknown";
    const ext =
      compressed.mimeType === "image/png"
        ? "png"
        : compressed.mimeType === "image/webp"
          ? "webp"
          : "jpg";
    const filePath = `${orgId}/${agencyId}/inspection/${bookingId}/${randomUUID()}.${ext}`;

    const photo = await inspectionRepository.addPhoto({
      reportId,
      content: compressed.buffer,
      fileName: file.name,
      mimeType: compressed.mimeType,
      note,
      sortOrder,
      filePath,
    });

    const signedUrl = await inspectionRepository.getPhotoSignedUrl(photo.id);
    revalidatePath(`/admin/reservations/${bookingId}`);

    return {
      ok: true,
      photo: { id: photo.id, signedUrl: signedUrl ?? "" },
    };
  } catch (e) {
    console.error("[uploadInspectionPhoto] error:", e);
    return {
      ok: false,
      error: "Impossible de traiter cette photo. Réessayez ou utilisez un autre format (JPG, PNG).",
    };
  }
}

// ─── Update photo note ──────────────────────────────────────────────

export async function updateInspectionPhotoNote(
  photoId: string,
  note: string | null,
  bookingId: string
): Promise<void> {
  const { inspectionRepository } = getContainer();
  await inspectionRepository.updatePhoto(photoId, { note });
  revalidatePath(`/admin/reservations/${bookingId}`);
}

// ─── Delete photo ───────────────────────────────────────────────────

export async function deleteInspectionPhoto(
  photoId: string,
  bookingId: string
): Promise<void> {
  const { inspectionRepository } = getContainer();
  await inspectionRepository.deletePhoto(photoId);
  revalidatePath(`/admin/reservations/${bookingId}`);
}

// ─── Sign report (client signature) ────────────────────────────────

export async function signInspectionReport(
  reportId: string,
  customerSignature: string,
  bookingId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { inspectionRepository, generateInspectionUseCase } = getContainer();
    await inspectionRepository.sign({ reportId, customerSignature });

    // Génère le PDF signé dans `documents` (fire-and-forget : on ne
    // bloque pas l'UI si le rendu est lent, mais on logge les erreurs).
    generateInspectionUseCase.execute(reportId).catch((err) => {
      console.error("[signInspectionReport] PDF generation failed:", err);
    });

    revalidatePath(`/admin/reservations/${bookingId}`);
    revalidatePath("/admin/documents");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur inconnue.",
    };
  }
}

// ─── Get signed URL for a photo (used by client component) ─────────

export async function getInspectionPhotoUrl(
  photoId: string
): Promise<string | null> {
  const { inspectionRepository } = getContainer();
  return inspectionRepository.getPhotoSignedUrl(photoId);
}

// ─── Régénérer le PDF d'état des lieux ─────────────────────────────

export async function regenerateInspectionPdf(
  reportId: string,
  bookingId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { generateInspectionUseCase } = getContainer();
    const outcome = await generateInspectionUseCase.execute(reportId);
    if (outcome.kind === "error") {
      return { ok: false, error: outcome.message };
    }
    revalidatePath(`/admin/reservations/${bookingId}`);
    revalidatePath("/admin/documents");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur inconnue.",
    };
  }
}
