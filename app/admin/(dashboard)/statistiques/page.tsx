import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { StatisticsContent } from "@/components/admin/statistics/statistics-content";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";

export default async function StatistiquesPage() {
  const agencyId = await getActiveAgency();
  const { getStatisticsUseCase } = getContainer();
  const stats = await getStatisticsUseCase.execute({ agencyId });

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Statistiques</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6 overflow-y-auto">
        <PageHeader
          title="Statistiques"
          description="Analyse de votre activité"
        />
        <StatisticsContent stats={stats} />
      </div>
    </>
  );
}
