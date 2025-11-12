"use client";

import { useState } from "react";
import type { Vehicle } from "@/types";
import { VehicleInfo } from "./vehicle-info";
import { BookingSummary } from "./booking-summary";
import { BookingForm } from "./booking-form";

interface BookingPageClientProps {
  vehicle: Vehicle;
  startDate: Date;
  endDate: Date;
}

export const BookingPageClient = ({
  vehicle,
  startDate,
  endDate,
}: BookingPageClientProps) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Vehicle Info or Form */}
      <div className="lg:col-span-2">
        {showForm ? (
          <BookingForm onBack={() => setShowForm(false)} />
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
          onProceedToForm={() => setShowForm(true)}
        />
      </div>
    </div>
  );
};
