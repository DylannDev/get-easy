import { Suspense } from "react";
import { redirect } from "next/navigation";
import { verifyCheckoutSession } from "@/actions/verify-checkout-session";
import { SuccessPageClient } from "./success-page-client";

interface BookingSuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function BookingSuccessPage({
  searchParams,
}: BookingSuccessPageProps) {
  // 1. Récupérer le session_id depuis l'URL
  const params = await searchParams;
  const sessionId = params.session_id;

  // 2. Si pas de session_id, rediriger vers l'accueil
  if (!sessionId) {
    redirect("/");
  }

  // 3. Vérifier le statut réel du paiement/booking côté serveur
  const verificationResult = await verifyCheckoutSession(sessionId);

  // 4. Déterminer le statut final
  const isSuccess =
    verificationResult.paymentStatus === "succeeded" ||
    verificationResult.bookingStatus === "paid";

  const isRefunded =
    verificationResult.paymentStatus === "refunded" ||
    verificationResult.bookingStatus === "refunded";

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SuccessPageClient
        status={isSuccess ? "success" : isRefunded ? "refunded" : "error"}
        bookingId={verificationResult.bookingId}
      />
    </Suspense>
  );
}
