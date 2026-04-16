"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PiFileText } from "react-icons/pi";

interface Props {
  bookingId: string;
  hasContract: boolean;
  isSigned?: boolean;
}

/**
 * Raccourci vers l'éditeur de contrat. L'édition + la régénération du PDF
 * se font dans la page dédiée `/admin/reservations/[id]/contrat`.
 */
export function GenerateContractButton({
  bookingId,
  hasContract,
  isSigned,
}: Props) {
  return (
    <Link href={`/admin/reservations/${bookingId}/contrat`}>
      <Button type="button" variant="outline" size="sm">
        <PiFileText className="size-4" />
        {isSigned
          ? "Éditer le contrat signé"
          : hasContract
            ? "Éditer le contrat"
            : "Créer le contrat"}
      </Button>
    </Link>
  );
}
