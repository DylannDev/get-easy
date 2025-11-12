import { redirect } from "next/navigation";
import { findVehicleById, validateDates } from "@/lib/utils";
import { BookingPageClient } from "@/components/booking/booking-page-client";
import Link from "next/link";

interface BookingPageProps {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}

export async function generateMetadata({ params }: BookingPageProps) {
  const { vehicleId } = await params;
  const vehicle = findVehicleById(vehicleId);

  if (!vehicle) {
    return {
      title: "Véhicule introuvable - Get Easy",
    };
  }

  return {
    title: `Réservation ${vehicle.brand} ${vehicle.model} - Get Easy`,
    description: `Finalisez votre réservation pour ${vehicle.brand} ${vehicle.model} à partir de ${vehicle.pricePerDay}€/jour en Guyane.`,
  };
}

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { vehicleId } = await params;
  const { start, end } = await searchParams;

  // Find vehicle
  const vehicle = findVehicleById(vehicleId);
  if (!vehicle) {
    redirect("/");
  }

  // Valide les dates
  const { isValid, startDate, endDate } = validateDates(start, end);
  // Redirige uniquement si les dates sont invalides, pas si elles sont simplement manquantes
  // Car l'utilisateur peut modifier les dates dans le composant BookingSummary
  if (!isValid || !startDate || !endDate) {
    redirect("/");
  }

  return (
    <main className="min-h-screen py-8 bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-6"
        >
          <svg
            className="size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour aux véhicules
        </Link>

        {/* Two Column Layout */}
        <BookingPageClient
          vehicle={vehicle}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </main>
  );
}
