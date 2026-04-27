import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { StatisticsContent } from "@/components/admin/statistics/statistics-content";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";

interface Props {
  searchParams: Promise<{ year?: string }>;
}

export default async function StatistiquesPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const requestedYear = Number(params.year);
  const year =
    Number.isFinite(requestedYear) &&
    requestedYear >= 2000 &&
    requestedYear <= currentYear + 1
      ? requestedYear
      : currentYear;

  const agencyId = await getActiveAgency();
  const { getStatisticsUseCase } = getContainer();
  const stats = await getStatisticsUseCase.execute({ agencyId, year });

  // 6 années sélectionnables : courante + 5 précédentes.
  const availableYears = Array.from(
    { length: 6 },
    (_, i) => currentYear - i
  );

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Statistiques</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        <PageHeader
          title="Statistiques"
          description="Analyse de votre activité"
        />
        <StatisticsContent stats={stats} availableYears={availableYears} />
      </div>
    </>
  );
}
