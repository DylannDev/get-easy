"use server";

import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";

/**
 * Retourne le nombre de résas payées créées après `sinceTimestamp`.
 * Utilisé par la sidebar pour afficher un badge "nouvelles résas".
 */
export async function getNewBookingsCount(
  sinceTimestamp: string | null
): Promise<number> {
  if (!sinceTimestamp) return 0;
  const agencyId = await getActiveAgency();
  const { bookingRepository } = getContainer();
  const { data } = await bookingRepository.findAllWithDetails({
    page: 1,
    pageSize: 100,
    agencyId,
    statuses: ["paid"] as never[],
    sort: { field: "created_at", direction: "desc" },
  });
  return data.filter(
    (b) => new Date(b.createdAt).getTime() > new Date(sinceTimestamp).getTime()
  ).length;
}
