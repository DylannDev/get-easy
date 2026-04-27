import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { BlockedPeriodsContent } from "@/components/admin/blocked-periods/blocked-periods-content";
import { listBlockedPeriods } from "@/actions/admin/blocked-periods";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";

export default async function IndisponibilitesPage() {
  const agencyId = await getActiveAgency();
  const [periods, vehicles] = await Promise.all([
    listBlockedPeriods(agencyId),
    getContainer().vehicleRepository.findByAgencyId(agencyId),
  ]);

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Indisponibilités</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        <PageHeader
          title="Indisponibilités"
          description={`${periods.length} période${periods.length > 1 ? "s" : ""} bloquée${periods.length > 1 ? "s" : ""}`}
        />
        <BlockedPeriodsContent periods={periods} vehicles={vehicles} />
      </div>
    </>
  );
}
