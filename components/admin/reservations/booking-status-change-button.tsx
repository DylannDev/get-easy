"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PiSwap } from "react-icons/pi";
import { BookingStatusChangeDialog } from "./booking-status-change-dialog";
import type { BookingStatus } from "@/domain/booking";

interface Props {
  bookingId: string;
  currentStatus: BookingStatus;
}

export function BookingStatusChangeButton({ bookingId, currentStatus }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <PiSwap className="size-4" />
        Changer le statut
      </Button>
      <BookingStatusChangeDialog
        open={open}
        onOpenChange={setOpen}
        bookingId={bookingId}
        currentStatus={currentStatus}
      />
    </>
  );
}
