import { getActiveAgencyId } from "@/actions/admin/switch-agency";
import { getContainer } from "@/composition-root/container";

/**
 * Returns the active agency ID from the cookie,
 * falling back to the first agency if not set.
 */
export async function getActiveAgency(): Promise<string> {
  const cookieAgencyId = await getActiveAgencyId();

  if (cookieAgencyId) return cookieAgencyId;

  // Fallback: first agency
  const { agencyRepository } = getContainer();
  const agencies = await agencyRepository.findAll();
  return agencies[0]?.id ?? "";
}
