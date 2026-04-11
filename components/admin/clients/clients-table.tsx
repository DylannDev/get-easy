"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Pagination } from "@/components/admin/shared/pagination";
import { ClientsSearch } from "./clients-search";
import { ClientsAgencyFilter } from "./clients-agency-filter";
import { formatDateCayenne } from "@/lib/format-date";
import type { Customer } from "@/domain/customer";

interface AgencyInfo {
  id: string;
  name: string;
  city: string;
}

interface ClientsTableProps {
  customers: Customer[];
  currentPage: number;
  totalPages: number;
  agencies?: AgencyInfo[];
}

export function ClientsTable({
  customers,
  currentPage,
  totalPages,
  agencies = [],
}: ClientsTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = (customerId: string) => {
    setLoading(true);
    router.push(`/admin/clients/${customerId}`);
  };

  return (
    <>
      {loading && <ContentOverlay />}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <ClientsSearch />
            {agencies.length > 1 && <ClientsAgencyFilter agencies={agencies} />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">
              Aucun client trouvé.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Inscrit le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleClick(customer.id)}
                    >
                      <TableCell>
                        <span className="font-medium capitalize">
                          {customer.firstName} {customer.lastName}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.email}
                      </TableCell>
                      <TableCell className="text-sm">
                        {customer.phone}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.city}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateCayenne(customer.createdAt, "dd MMM yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t px-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
