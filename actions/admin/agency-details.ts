"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/infrastructure/supabase/client";
import { getContainer } from "@/composition-root/container";

const LOGO_BUCKET = "organization-logos";
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB
// Accepté en entrée — stocké tel quel. Les formats vectoriels (SVG) ou
// modernes (WEBP) sont préférés pour l'affichage web (poids réduit) ;
// `@react-pdf/renderer` les convertira à la volée en PNG pour les PDFs.
const ACCEPTED_LOGO_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

const legalSchema = z.object({
  legalForm: z.string().max(120).optional().nullable(),
  capitalSocial: z.string().max(60).optional().nullable(),
  rcsCity: z.string().max(80).optional().nullable(),
  rcsNumber: z.string().max(60).optional().nullable(),
  siret: z.string().max(20).optional().nullable(),
  tvaIntracom: z.string().max(30).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  logoDarkUrl: z.string().url().optional().nullable(),
  vatEnabled: z.boolean().optional(),
});

export type UpdateAgencyLegalFormInput = z.input<typeof legalSchema>;

/**
 * Updates the legal details across ALL agencies of the same organization —
 * the legal identity is organization-wide, not per-agency.
 */
export async function updateAgencyLegalDetails(
  agencyId: string,
  input: UpdateAgencyLegalFormInput
) {
  const parsed = legalSchema.parse(input);
  const { agencyRepository, updateAgencyDetailsUseCase } = getContainer();
  const agency = await agencyRepository.findById(agencyId);
  if (!agency) throw new Error("Agence introuvable.");

  const allAgencies = await agencyRepository.findAll();
  const siblings = agency.organizationId
    ? allAgencies.filter((a) => a.organizationId === agency.organizationId)
    : [agency];
  await Promise.all(
    siblings.map((a) => updateAgencyDetailsUseCase.execute(a.id, parsed))
  );
  revalidatePath("/admin/infos-agence");
  revalidatePath("/admin/infos-organisation");
}

export type LogoVariant = "light" | "dark";

/**
 * Uploads a logo image to the `organization-logos` bucket.
 *
 * Logos are shared across agencies within the same organization, which is why
 * the path is keyed by `organizationId/` rather than by agency id.
 *
 * `variant` chooses which DB column to update:
 *  - "light" → logo_url (version claire, fond sombre)
 *  - "dark"  → logo_dark_url (version foncée, fond clair)
 */
export async function uploadOrganizationLogo(
  agencyId: string,
  variant: LogoVariant,
  formData: FormData
): Promise<{ url: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Fichier manquant.");
  if (file.size === 0) throw new Error("Fichier vide.");
  if (file.size > MAX_LOGO_SIZE) {
    throw new Error("Logo trop volumineux (max 2 Mo).");
  }
  if (!ACCEPTED_LOGO_MIME.includes(file.type)) {
    throw new Error(
      `Format non supporté (${file.type}). Utilisez PNG, JPG, WEBP ou SVG.`
    );
  }

  const { agencyRepository, updateAgencyDetailsUseCase } = getContainer();
  const agency = await agencyRepository.findById(agencyId);
  if (!agency) throw new Error("Agence introuvable.");
  if (!agency.organizationId) {
    throw new Error("Organisation introuvable pour cette agence.");
  }

  // Stockage tel quel. Les formats vectoriels (SVG) ou modernes (WEBP) sont
  // conservés car avantageux pour le web ; ils seront convertis en PNG à la
  // volée lors de la génération des PDFs.
  const buffer = Buffer.from(await file.arrayBuffer());
  const extMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  const ext = extMap[file.type] ?? "bin";
  const path = `${agency.organizationId}/logo-${variant}-${Date.now()}.${ext}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });
  if (uploadError) {
    throw new Error(`Échec du téléversement : ${uploadError.message}`);
  }

  const { data: publicUrl } = supabase.storage
    .from(LOGO_BUCKET)
    .getPublicUrl(path);

  const url = publicUrl?.publicUrl;
  if (!url) throw new Error("Impossible de générer l'URL du logo.");

  // Propagate to every agency of the same organization so that invoices and
  // contracts pick up the latest visual identity everywhere.
  const allAgencies = await agencyRepository.findAll();
  const siblings = allAgencies.filter(
    (a) => a.organizationId === agency.organizationId
  );
  const patch = variant === "light" ? { logoUrl: url } : { logoDarkUrl: url };
  await Promise.all(
    siblings.map((a) => updateAgencyDetailsUseCase.execute(a.id, patch))
  );

  revalidatePath("/admin/infos-agence");
  revalidatePath("/admin/infos-organisation");
  return { url };
}

/**
 * Sauvegarde immédiate de la signature/tampon par défaut du Loueur pour
 * l'agence courante. Pas de propagation aux siblings (chaque agence a sa
 * propre signature).
 */
export async function saveAgencySignature(
  agencyId: string,
  dataUrl: string | null
): Promise<void> {
  const { agencyRepository } = getContainer();
  const agency = await agencyRepository.findById(agencyId);
  if (!agency) throw new Error("Agence introuvable.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("agencies")
    .update({ default_loueur_signature: dataUrl })
    .eq("id", agencyId);

  if (error) {
    // Cas le plus fréquent en dev : la migration
    // `add_default_loueur_signature_to_agencies.sql` n'a pas été appliquée
    // sur Supabase et la colonne n'existe pas encore.
    if (
      error.message?.toLowerCase().includes("column") ||
      error.code === "42703"
    ) {
      throw new Error(
        "La colonne `default_loueur_signature` n'existe pas. Applique la migration `add_default_loueur_signature_to_agencies.sql` dans Supabase."
      );
    }
    throw new Error(`Échec de la sauvegarde : ${error.message}`);
  }

  revalidatePath("/admin/infos-agence");
}

export async function removeOrganizationLogo(
  agencyId: string,
  variant: LogoVariant
): Promise<void> {
  const { agencyRepository, updateAgencyDetailsUseCase } = getContainer();
  const agency = await agencyRepository.findById(agencyId);
  if (!agency?.organizationId) return;

  const allAgencies = await agencyRepository.findAll();
  const siblings = allAgencies.filter(
    (a) => a.organizationId === agency.organizationId
  );
  const patch = variant === "light" ? { logoUrl: null } : { logoDarkUrl: null };
  await Promise.all(
    siblings.map((a) => updateAgencyDetailsUseCase.execute(a.id, patch))
  );
  revalidatePath("/admin/infos-agence");
  revalidatePath("/admin/infos-organisation");
}
