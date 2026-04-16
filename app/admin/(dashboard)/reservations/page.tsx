import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { ReservationsTable } from "@/components/admin/reservations/reservations-table";
import { Button } from "@/components/ui/button";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";
import { PiPlus } from "react-icons/pi";
import type { BookingStatus } from "@/domain/booking";

interface Props {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

const PAGE_SIZE = 15;

export default async function ReservationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || undefined;
  const statuses = params.status
    ? (params.status.split(",") as BookingStatus[])
    : undefined;
  const startDate = params.startDate || undefined;
  const endDate = params.endDate || undefined;

  const agencyId = await getActiveAgency();
  const { bookingRepository } = getContainer();
  const { data: bookings, count } = await bookingRepository.findAllWithDetails({
    page,
    pageSize: PAGE_SIZE,
    agencyId,
    statuses,
    search,
    startDate,
    endDate,
    sort: { field: "created_at", direction: "desc" },
  });

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Réservations</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6 overflow-y-auto">
        <PageHeader
          title="Réservations"
          description={`${count} réservation${count > 1 ? "s" : ""} au total`}
          action={
            <Link href="/admin/reservations/nouvelle">
              <Button variant="default" size="sm">
                <PiPlus className="size-4" />
                Nouvelle réservation
              </Button>
            </Link>
          }
        />

        <ReservationsTable
          bookings={bookings}
          currentPage={page}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}
