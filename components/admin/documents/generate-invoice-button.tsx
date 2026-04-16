"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { generateInvoiceForBooking } from "@/actions/admin/documents";
import { PiReceipt } from "react-icons/pi";

interface Props {
  bookingId: string;
  hasInvoice: boolean;
}

export function GenerateInvoiceButton({ bookingId, hasInvoice }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    const result = await generateInvoiceForBooking(bookingId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Erreur lors de la génération.");
      return;
    }
    router.refresh();
  };

  return (
    <>
      {loading && <ContentOverlay />}
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleClick} disabled={loading}>
          <PiReceipt className="size-4" />
          {hasInvoice ? "Régénérer la facture" : "Générer la facture"}
        </Button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </>
  );
}
