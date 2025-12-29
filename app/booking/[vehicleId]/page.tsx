import { redirect } from "next/navigation";
import { validateDates } from "@/lib/utils";
import { BookingPageClient } from "@/components/booking/booking-page-client";
import { getVehicleById, getAgencyById } from "@/lib/supabase/queries";
import { mapVehicleFromDB } from "@/lib/supabase/mappers";
import { getVehicleBookings } from "@/actions/get-vehicle-bookings";

interface BookingPageProps {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ start?: string; end?: string; bookingId?: string }>;
}

export async function generateMetadata({ params }: BookingPageProps) {
  const { vehicleId } = await params;
  const dbVehicle = await getVehicleById(vehicleId);

  if (!dbVehicle) {
    return {
      title: "Véhicule introuvable - Get Easy",
    };
  }

  const vehicle = mapVehicleFromDB(dbVehicle);

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
  const { start, end, bookingId } = await searchParams;

  // Find vehicle from Supabase
  const dbVehicle = await getVehicleById(vehicleId);
  if (!dbVehicle) {
    redirect("/");
  }

  const vehicle = mapVehicleFromDB(dbVehicle);

  // Récupérer l'agencyId depuis le véhicule DB
  const agencyId = dbVehicle.agency_id;

  // Récupérer l'agence pour obtenir son nom et ses horaires
  const agency = await getAgencyById(agencyId);

  if (!agency) {
    redirect("/");
  }

  // Récupérer les bookings du véhicule
  const bookings = await getVehicleBookings(vehicleId);

  // Parse dates from URL or use defaults
  let startDate: Date;
  let endDate: Date;

  if (start && end) {
    const {
      isValid,
      startDate: parsedStart,
      endDate: parsedEnd,
    } = validateDates(start, end);
    if (isValid && parsedStart && parsedEnd) {
      startDate = parsedStart;
      endDate = parsedEnd;
    } else {
      // Use default dates if parsing fails
      startDate = new Date();
      startDate.setHours(8, 0, 0, 0);
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(8, 0, 0, 0);
    }
  } else {
    // No dates provided, use defaultsxj
    startDate = new Date();
    startDate.setHours(8, 0, 0, 0);
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(8, 0, 0, 0);
  }

  return (
    <main className="min-h-screen pt-6 pb-12 bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Booking Content with Timeline */}
        <BookingPageClient
          vehicle={vehicle}
          agency={agency}
          startDate={startDate}
          endDate={endDate}
          bookings={bookings}
          bookingId={bookingId}
        />
      </div>
    </main>
  );
}
