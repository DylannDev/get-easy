"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { BookingResultCard } from "@/components/booking/booking-result-card";

export default function BookingCancelledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <BookingResultCard
        icon={XCircle}
        iconColor="text-red-500"
        title="Paiement annulé"
        description={
          <>
            <p className="text-gray-600">
              Votre paiement a été annulé. Aucun montant n&apos;a été débité.
            </p>
          </>
        }
        primaryButton={{
          label: "Retour à l'accueil",
          onClick: () => router.push("/"),
        }}
        secondaryButton={{
          label: "Retour à la réservation",
          onClick: () => router.back(),
          variant: "outline",
        }}
      />
    </div>
  );
}
