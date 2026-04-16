import { getActiveAgencyId } from "@/actions/admin/switch-agency";
import { getContainer } from "@/composition-root/container";

/**
 * Returns the active agency ID from the cookie, validating that the agency
 * still exists. Falls back to the first agency if the cookie is missing or
 * points to a deleted agency.
 */
export async function getActiveAgency(): Promise<string> {
  const cookieAgencyId = await getActiveAgencyId();
  const { agencyRepository } = getContainer();

  if (cookieAgencyId) {
    const agency = await agencyRepository.findById(cookieAgencyId);
    if (agency) return agency.id;
  }

  // Fallback: first existing agency
  const agencies = await agencyRepository.findAll();
  return agencies[0]?.id ?? "";
}
