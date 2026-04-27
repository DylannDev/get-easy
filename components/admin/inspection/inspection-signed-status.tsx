"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PiCheck, PiFilePdf } from "react-icons/pi";
import { regenerateInspectionPdf } from "@/actions/admin/inspection";

interface Props {
  reportId: string;
  bookingId: string;
  signedAt: string;
}

/** Bandeau affiché en haut quand l'état des lieux est signé : badge
 *  "Signé le …" + bouton de régénération du PDF. La signature elle-même
 *  est affichée en bas via `<InspectionSignatureImage />`. */
export function InspectionSignedStatus({
  reportId,
  bookingId,
  signedAt,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    await regenerateInspectionPdf(reportId, bookingId);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
      <div className="flex items-center gap-2 text-sm bg-emerald-100 text-emerald-700 border-emerald-200 border rounded-lg px-4 py-2 w-fit">
        <PiCheck className="size-4" />
        <span>
          Signé le{" "}
          {new Date(signedAt).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        disabled={loading}
        onClick={handleRegenerate}
      >
        <PiFilePdf className="size-4" />
        Régénérer l&apos;état des lieux
      </Button>
    </div>
  );
}

interface SignatureImageProps {
  value: string;
}

/** Affichage de l'image de signature client sous les photos une fois l'EDL
 *  signé. Préserve l'ordre visuel original (signature en bas, après les
 *  photos). */
export function InspectionSignatureImage({ value }: SignatureImageProps) {
  return (
    <div className="border-t pt-4">
      <p className="text-xs text-muted-foreground mb-2">Signature du client</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={value}
        alt="Signature client"
        className="h-20 border border-gray-200 rounded bg-white p-2"
      />
    </div>
  );
}
