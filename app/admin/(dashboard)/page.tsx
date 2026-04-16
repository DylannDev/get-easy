import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { SummaryCards } from "@/components/admin/dashboard/summary-cards";
import { RecentBookingsTable } from "@/components/admin/dashboard/recent-bookings-table";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";
import type { BookingStatus } from "@/domain/booking";

interface Props {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || undefined;
  const statuses = params.status
    ? (params.status.split(",") as BookingStatus[])
    : undefined;

  const agencyId = await getActiveAgency();
  const { getDashboardSummaryUseCase } = getContainer();
  const summary = await getDashboardSummaryUseCase.execute({
    page,
    search,
    statuses,
    agencyId,
  });

  const totalPages = Math.ceil(summary.totalBookings / 10);

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Tableau de bord</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6 overflow-y-auto overflow-y-auto">
        <PageHeader
          title="Tableau de bord"
          description="Vue d'ensemble de votre activité"
        />

        <SummaryCards
          departuresCount={summary.todayDepartures.length}
          returnsCount={summary.todayReturns.length}
          activeRentalsCount={summary.activeRentalsCount}
        />

        <RecentBookingsTable
          bookings={summary.recentBookings}
          currentPage={page}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}
