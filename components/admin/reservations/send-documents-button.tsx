"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PiEnvelope } from "react-icons/pi";
import {
  SendDocumentsDialog,
  type DocumentOption,
} from "./send-documents-dialog";

interface Props {
  bookingId: string;
  defaultEmail: string;
  options: DocumentOption[];
}

export function SendDocumentsButton({
  bookingId,
  defaultEmail,
  options,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => setOpen(true)}
        disabled={options.length === 0}
      >
        <PiEnvelope className="size-4" />
        Envoyer par mail
      </Button>
      <SendDocumentsDialog
        open={open}
        onOpenChange={setOpen}
        bookingId={bookingId}
        defaultEmail={defaultEmail}
        options={options}
      />
    </>
  );
}
