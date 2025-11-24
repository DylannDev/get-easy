import { Suspense } from "react";
import { SuccessPageClient } from "./success-page-client";

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SuccessPageClient />
    </Suspense>
  );
}
