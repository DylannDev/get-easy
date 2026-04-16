import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { ClientsTable } from "@/components/admin/clients/clients-table";
import { getContainer } from "@/composition-root/container";

interface Props {
  searchParams: Promise<{
    page?: string;
    search?: string;
    agencies?: string;
  }>;
}

const PAGE_SIZE = 15;

export default async function ClientsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || undefined;
  const agencyFilter = params.agencies
    ? params.agencies.split(",").filter(Boolean)
    : undefined;

  const { customerRepository, agencyRepository, bookingRepository } =
    getContainer();

  const agencies = await agencyRepository.findAll();

  // If agency filter is set, find customer IDs with bookings in those agencies
  let customerIdsFilter: string[] | undefined;
  if (agencyFilter && agencyFilter.length > 0) {
    const { data: bookings } = await bookingRepository.findAllWithDetails({
      page: 1,
      pageSize: 100000,
      sort: { field: "created_at", direction: "desc" },
    });
    const filteredBookings = bookings.filter((b) =>
      agencyFilter.includes(b.agencyId)
    );
    customerIdsFilter = [
      ...new Set(filteredBookings.map((b) => b.customerId)),
    ];
  }

  const { data: allCustomers, count: totalCount } =
    await customerRepository.findAll({
      search,
      page: customerIdsFilter ? 1 : page,
      pageSize: customerIdsFilter ? 100000 : PAGE_SIZE,
    });

  // Apply agency filter client-side
  let customers = allCustomers;
  let count = totalCount;
  if (customerIdsFilter) {
    const idSet = new Set(customerIdsFilter);
    customers = allCustomers.filter((c) => idSet.has(c.id));
    count = customers.length;
    const from = (page - 1) * PAGE_SIZE;
    customers = customers.slice(from, from + PAGE_SIZE);
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);

  const agencyInfos = agencies.map((a) => ({
    id: a.id,
    name: a.name,
    city: a.city,
  }));

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Clients</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6 overflow-y-auto">
        <PageHeader
          title="Clients"
          description={`${count} client${count > 1 ? "s" : ""} au total`}
        />
        <ClientsTable
          customers={customers}
          currentPage={page}
          totalPages={totalPages}
          agencies={agencyInfos}
        />
      </div>
    </>
  );
}
