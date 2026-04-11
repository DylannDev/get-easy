import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { PlanningView } from "@/components/admin/planning/planning-view";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";

export default async function PlanningPage() {
  const agencyId = await getActiveAgency();
  const start = new Date("2024-01-01");
  const end = new Date("2028-12-31");

  const { getPlanningDataUseCase } = getContainer();
  const planning = await getPlanningDataUseCase.execute({
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    agencyId,
  });

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Planning</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Planning"
          description="Vue d'ensemble des réservations par véhicule"
        />
        <PlanningView rows={planning.rows} />
      </div>
    </>
  );
}
