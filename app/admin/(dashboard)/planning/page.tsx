import { format } from "date-fns";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { PlanningView } from "@/components/admin/planning/planning-view";
import { SummaryCards } from "@/components/admin/dashboard/summary-cards";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";

export default async function PlanningPage() {
  const agencyId = await getActiveAgency();
  const start = new Date("2024-01-01");
  const end = new Date("2028-12-31");
  const today = format(new Date(), "yyyy-MM-dd");

  const { getPlanningDataUseCase, bookingRepository } = getContainer();
  const [planning, todayDepartures, todayReturns, activeRentalsCount] =
    await Promise.all([
      getPlanningDataUseCase.execute({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        agencyId,
      }),
      bookingRepository.findDeparturesByDate(today, agencyId),
      bookingRepository.findReturnsByDate(today, agencyId),
      bookingRepository.countActiveRentals(agencyId),
    ]);

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Planning</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        <PageHeader
          title="Planning"
          description="Vue d'ensemble des réservations par véhicule"
        />
        <SummaryCards
          departuresCount={todayDepartures.length}
          returnsCount={todayReturns.length}
          activeRentalsCount={activeRentalsCount}
        />
        <PlanningView rows={planning.rows} />
      </div>
    </>
  );
}
