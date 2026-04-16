"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";
import type { DocumentType } from "@/domain/document";

const ACCEPTED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const uploadSchema = z.object({
  type: z.enum(["invoice", "contract", "other"]),
  bookingId: z.string().uuid().optional().nullable(),
});

export async function uploadDocument(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Fichier manquant.");
  }
  if (file.size === 0) throw new Error("Fichier vide.");
  if (file.size > MAX_SIZE) {
    throw new Error("Fichier trop volumineux (max 10 Mo).");
  }
  if (!ACCEPTED_MIME.includes(file.type)) {
    throw new Error(
      `Type de fichier non supporté (${file.type}). Utilisez PDF ou image.`
    );
  }

  const parsed = uploadSchema.parse({
    type: formData.get("type"),
    bookingId: formData.get("bookingId") || null,
  });

  const agencyId = await getActiveAgency();
  if (!agencyId) {
    throw new Error("Aucune agence active. Veuillez en sélectionner une.");
  }

  const { uploadDocumentUseCase, agencyRepository } = getContainer();
  const agency = await agencyRepository.findById(agencyId);
  if (!agency) throw new Error("Agence introuvable.");

  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadDocumentUseCase.execute({
    agencyId,
    bookingId: parsed.bookingId ?? null,
    type: parsed.type as DocumentType,
    content: buffer,
    fileName: file.name,
    mimeType: file.type,
  });

  revalidatePath("/admin/documents");
  if (parsed.bookingId) {
    revalidatePath(`/admin/reservations/${parsed.bookingId}`);
  }
}

export async function deleteDocument(id: string, bookingId?: string | null) {
  const {
    deleteDocumentUseCase,
    documentRepository,
    contractFieldsRepository,
  } = getContainer();

  // Si on supprime un contrat, on efface aussi les champs + signatures
  // associés : l'utilisateur repart d'une ardoise vierge.
  const doc = await documentRepository.findById(id);
  if (doc?.type === "contract" && doc.bookingId) {
    await contractFieldsRepository.deleteByBooking(doc.bookingId);
  }

  await deleteDocumentUseCase.execute(id);
  revalidatePath("/admin/documents");
  if (bookingId) revalidatePath(`/admin/reservations/${bookingId}`);
}

export async function getDocumentInlineUrl(
  id: string
): Promise<string | null> {
  const { getDocumentSignedUrlUseCase } = getContainer();
  return getDocumentSignedUrlUseCase.execute(id);
}

export async function getDocumentDownloadUrl(
  id: string
): Promise<string | null> {
  const { getDocumentSignedUrlUseCase } = getContainer();
  return getDocumentSignedUrlUseCase.execute(id, { forceDownload: true });
}

export async function generateInvoiceForBooking(
  bookingId: string
): Promise<{ ok: boolean; error?: string }> {
  const { generateInvoiceUseCase } = getContainer();
  const result = await generateInvoiceUseCase.execute(bookingId);
  if (result.kind === "error") {
    return { ok: false, error: result.message };
  }
  revalidatePath("/admin/documents");
  revalidatePath(`/admin/reservations/${bookingId}`);
  return { ok: true };
}

export async function generateContractForBooking(
  bookingId: string
): Promise<{ ok: boolean; error?: string }> {
  const { generateContractUseCase } = getContainer();
  const result = await generateContractUseCase.execute(bookingId);
  if (result.kind === "error") {
    return { ok: false, error: result.message };
  }
  revalidatePath("/admin/documents");
  revalidatePath(`/admin/reservations/${bookingId}`);
  return { ok: true };
}

type SaveContractInput = {
  fields: Record<string, string | undefined>;
  customerSignature?: string | null;
  loueurSignature?: string | null;
};

/**
 * Sauvegarde les champs saisis dans l'éditeur de contrat et régénère le
 * PDF plat associé.
 */
export async function saveContractForBooking(
  bookingId: string,
  input: SaveContractInput
): Promise<{
  ok: boolean;
  error?: string;
  customerSignature?: string | null;
  loueurSignature?: string | null;
  signedAt?: string | null;
}> {
  const { saveContractFieldsUseCase } = getContainer();
  const result = await saveContractFieldsUseCase.execute({
    bookingId,
    fields: input.fields,
    customerSignature: input.customerSignature,
    loueurSignature: input.loueurSignature,
  });
  if (result.kind === "error") {
    return { ok: false, error: result.message };
  }
  revalidatePath("/admin/documents");
  revalidatePath(`/admin/reservations/${bookingId}`);
  revalidatePath(`/admin/reservations/${bookingId}/contrat`);
  return {
    ok: true,
    customerSignature: result.contract.customerSignature,
    loueurSignature: result.contract.loueurSignature,
    signedAt: result.contract.signedAt,
  };
}
