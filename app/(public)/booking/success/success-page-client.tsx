"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { BookingResultCard } from "@/components/booking/booking-result-card";

interface SuccessPageClientProps {
  status: "success" | "refunded" | "error";
  bookingId?: string;
}

export function SuccessPageClient({
  status,
  bookingId,
}: SuccessPageClientProps) {
  const router = useRouter();

  // Cas 1 : Paiement réussi
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <BookingResultCard
          icon={CheckCircle}
          iconColor="text-green"
          title="Paiement réussi !"
          description={
            <>
              <p className="text-gray-600">
                Votre réservation a été confirmée avec succès.
              </p>
              <p className="text-gray-600">
                Un email de confirmation vous a été envoyé avec tous les détails
                de votre réservation.
              </p>
            </>
          }
          primaryButton={{
            label: "Retour à l'accueil",
            onClick: () => router.push("/"),
          }}
        />
      </div>
    );
  }

  // Cas 2 : Paiement remboursé (véhicule déjà réservé)
  if (status === "refunded") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <BookingResultCard
          icon={XCircle}
          iconColor="text-red-500"
          title="Véhicule indisponible"
          description={
            <>
              <p className="text-gray-600">
                Le véhicule a été réservé par un autre client pendant que vous
                effectuiez votre paiement.
              </p>
              <p className="text-gray-600">
                Votre paiement a été automatiquement remboursé. Vous recevrez le
                montant sur votre compte sous 5 à 10 jours ouvrés.
              </p>
              <p className="text-gray-600 mt-2">
                Un email de confirmation de remboursement vous a été envoyé.
              </p>
            </>
          }
          primaryButton={{
            label: "Choisir un autre véhicule",
            onClick: () => router.push("/"),
          }}
        />
      </div>
    );
  }

  // Cas 3 : Erreur ou statut inconnu
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <BookingResultCard
        icon={AlertCircle}
        iconColor="text-red-500"
        title="Erreur de vérification"
        description={
          <>
            <p className="text-gray-600">
              Nous ne pouvons pas vérifier le statut de votre paiement pour le
              moment.
            </p>
            <p className="text-gray-600">
              Si vous avez effectué un paiement, vous recevrez un email de
              confirmation. Sinon, veuillez réessayer ou nous contacter.
            </p>
            {bookingId && (
              <p className="text-sm text-gray-500 mt-2">
                Référence : {bookingId}
              </p>
            )}
          </>
        }
        primaryButton={{
          label: "Retour à l'accueil",
          onClick: () => router.push("/"),
        }}
        // secondaryButton={{
        //   label: "Nous contacter",
        //   onClick: () => router.push("/contact"),
        // }}
      />
    </div>
  );
}
