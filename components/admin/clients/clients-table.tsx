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
import { CustomerDeleteDialog } from "./customer-delete-dialog";
import { formatDateCayenne } from "@/lib/format-date";
import { PiPencilSimple, PiTrash } from "react-icons/pi";
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
  const [deleteTarget, setDeleteTarget] = useState<{
    customerId: string;
    customerName: string;
  } | null>(null);

  const handleClick = (customerId: string) => {
    setLoading(true);
    router.push(`/admin/clients/${customerId}`);
  };

  return (
    <>
      {loading && <ContentOverlay />}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <ClientsSearch />
            {agencies.length > 1 && <ClientsAgencyFilter agencies={agencies} />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 sm:p-6">
              Aucun client trouvé.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <div className="flex flex-col">
                          {customer.companyName && (
                            <span className="font-medium">
                              {customer.companyName}
                            </span>
                          )}
                          <span
                            className={
                              customer.companyName
                                ? "text-xs text-muted-foreground capitalize"
                                : "font-medium capitalize"
                            }
                          >
                            {customer.firstName} {customer.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {customer.companyName ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs font-medium">
                            Pro
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 text-xs font-medium">
                            Particulier
                          </span>
                        )}
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLoading(true);
                              router.push(
                                `/admin/clients/${customer.id}/editer`
                              );
                            }}
                            title="Modifier"
                            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                          >
                            <PiPencilSimple className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({
                                customerId: customer.id,
                                customerName: `${customer.firstName} ${customer.lastName}`,
                              });
                            }}
                            title="Supprimer"
                            className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                          >
                            <PiTrash className="size-4" />
                          </button>
                        </div>
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

      {deleteTarget && (
        <CustomerDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(next) => {
            if (!next) setDeleteTarget(null);
          }}
          customerId={deleteTarget.customerId}
          customerName={deleteTarget.customerName}
        />
      )}
    </>
  );
}
