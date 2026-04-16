"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/composition-root/container";
import type { RichTextDocument } from "@/domain/agency";

/**
 * Updates the rental_terms (Tiptap JSON) of the given agency.
 *
 * The caller passes the agency id explicitly (rather than relying on the
 * active-agency cookie) because the /admin/infos-agence screen already
 * lets the user pick any agency they have access to, independent of the
 * active-agency selector in the sidebar.
 */
export async function updateAgencyRentalTerms(
  agencyId: string,
  rentalTerms: RichTextDocument | null
): Promise<void> {
  const { agencyRepository, updateAgencyTermsUseCase } = getContainer();

  const agency = await agencyRepository.findById(agencyId);
  if (!agency) {
    throw new Error("Agence introuvable.");
  }

  await updateAgencyTermsUseCase.execute(agencyId, rentalTerms);

  revalidatePath("/admin/infos-agence");
  revalidatePath("/conditions-generales-de-location");
}
