"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function BookingCancelledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <XCircle className="size-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement annulé
          </h1>
          <p className="text-gray-600">
            Votre paiement a été annulé. Aucun montant n'a été débité.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Vous pouvez retourner à l'accueil pour effectuer une nouvelle recherche ou réessayer votre réservation.
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => router.push("/")}
              className="w-full"
              size="lg"
            >
              Retour à l'accueil
            </Button>

            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Retour à la réservation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
