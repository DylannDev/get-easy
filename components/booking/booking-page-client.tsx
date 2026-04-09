"use client";

import { useState } from "react";
import type { Vehicle } from "@/types";
import type { BookingAvailabilityView } from "@/domain/vehicle";
import type { Agency } from "@/domain/agency";
import { BookingVehicleSummary } from "./booking-vehicle-summary";
import { BookingSummary } from "./booking-summary";
import { BookingForm } from "./booking-form";
import { Timeline, type TimelineStep } from "@/components/ui/timeline";
import { useBookingSummary } from "@/hooks/use-booking-summary";

interface BookingPageClientProps {
  vehicle: Vehicle;
  agency: Agency;
  startDate: Date;
  endDate: Date;
  bookings: BookingAvailabilityView[];
  bookingId?: string;
}

const BOOKING_STEPS: TimelineStep[] = [
  { id: 0, label: "Véhicule" },
  { id: 1, label: "Conditions et récapitulatif" },
  { id: 2, label: "Vos informations" },
  { id: 3, label: "Paiement" },
];

export const BookingPageClient = ({
  vehicle,
  agency,
  startDate,
  endDate,
  bookings,
  bookingId,
}: BookingPageClientProps) => {
  const [currentStep, setCurrentStep] = useState(1); // Démarre à l'étape 1 (Conditions et récapitulatif)
  const [showForm, setShowForm] = useState(false);

  // Utiliser le hook useBookingSummary au niveau parent pour partager l'état entre BookingSummary et BookingForm
  const bookingSummaryData = useBookingSummary({
    vehicle,
    agency,
    startDate,
    endDate,
    bookings,
  });

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);

    // Étape 0: Retour à la page d'accueil (sélection du véhicule)
    if (stepId === 0) {
      window.location.href = "/";
    }
    // Étape 1: Conditions et récapitulatif
    else if (stepId === 1) {
      setShowForm(false);
    }
    // Étape 2: Vos informations
    else if (stepId === 2) {
      setShowForm(true);
    }
  };

  const handleBackFromForm = () => {
    setCurrentStep(1);
    setShowForm(false);
  };

  const handleProceedToForm = () => {
    setCurrentStep(2);
    setShowForm(true);
    // Scroll vers le haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Timeline */}
      <div className="mb-6">
        <Timeline
          steps={BOOKING_STEPS}
          activeStep={currentStep}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Vehicle Info or Form */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          {showForm ? (
            <BookingForm
              onBack={handleBackFromForm}
              vehicle={vehicle}
              agency={agency}
              startDate={startDate}
              endDate={endDate}
              numberOfDays={bookingSummaryData.numberOfDays}
              totalPrice={bookingSummaryData.totalPrice}
              bookingId={bookingId}
            />
          ) : (
            <BookingVehicleSummary vehicle={vehicle} />
          )}
        </div>

        {/* Right Column - Booking Summary (masqué sur mobile quand showForm est true) */}
        <div
          className={`lg:col-span-1 order-1 lg:order-2 ${showForm ? "hidden lg:block" : ""}`}
        >
          <BookingSummary
            vehicle={vehicle}
            currentStep={currentStep}
            onProceedToForm={handleProceedToForm}
            bookingSummaryData={bookingSummaryData}
          />
        </div>
      </div>
    </>
  );
};
