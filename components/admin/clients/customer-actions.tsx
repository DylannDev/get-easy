"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { PiPencilSimple } from "react-icons/pi";
import { CustomerDeleteDialog } from "./customer-delete-dialog";

interface Props {
  customerId: string;
  customerName: string;
}

export function CustomerActions({ customerId, customerName }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
      <Link href={`/admin/clients/${customerId}/editer`}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <PiPencilSimple className="size-4" />
          Modifier
        </Button>
      </Link>
      <DeleteButton
        className="w-full sm:w-auto"
        onClick={() => setDeleteOpen(true)}
      />
      <CustomerDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        customerId={customerId}
        customerName={customerName}
      />
    </div>
  );
}
