"use client";

import { useState } from "react";
import type { Vehicle } from "@/types";
import { VehicleInfo } from "./vehicle-info";
import { BookingSummary } from "./booking-summary";
import { BookingForm } from "./booking-form";
import { Timeline, type TimelineStep } from "@/components/ui/timeline";

interface BookingPageClientProps {
  vehicle: Vehicle;
  agencyId: string;
  startDate: Date;
  endDate: Date;
}

const BOOKING_STEPS: TimelineStep[] = [
  { id: 0, label: "Véhicule" },
  { id: 1, label: "Conditions et récapitulatif" },
  { id: 2, label: "Vos informations" },
  { id: 3, label: "Paiement" },
];

export const BookingPageClient = ({
  vehicle,
  agencyId,
  startDate,
  endDate,
}: BookingPageClientProps) => {
  const [currentStep, setCurrentStep] = useState(1); // Démarre à l'étape 1 (Conditions et récapitulatif)
  const [showForm, setShowForm] = useState(false);

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
        <div className="lg:col-span-2">
          {showForm ? (
            <BookingForm
              onBack={handleBackFromForm}
              vehicle={vehicle}
              agencyId={agencyId}
              startDate={startDate}
              endDate={endDate}
            />
          ) : (
            <VehicleInfo vehicle={vehicle} />
          )}
        </div>

        {/* Right Column - Booking Summary */}
        <div className="lg:col-span-1">
          <BookingSummary
            vehicle={vehicle}
            startDate={startDate}
            endDate={endDate}
            currentStep={currentStep}
            onProceedToForm={handleProceedToForm}
          />
        </div>
      </div>
    </>
  );
};
