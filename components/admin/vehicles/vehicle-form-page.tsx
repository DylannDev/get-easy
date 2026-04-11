"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { BackLink } from "@/components/admin/shared/back-link";
import { AdminHeader } from "@/components/admin/admin-header";
import { VehicleForm } from "./vehicle-form";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import type { Vehicle } from "@/domain/vehicle";

interface VehicleFormPageProps {
  vehicle?: Vehicle;
  agencyId: string;
  existingImages: string[];
  title: string;
}

export function VehicleFormPage({
  vehicle,
  agencyId,
  existingImages,
  title,
}: VehicleFormPageProps) {
  const [loading, setLoading] = useState(false);

  return (
    <>
      <AdminHeader>
        <BackLink href="/admin/vehicules" label="Véhicules" />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6">
        {loading && <ContentOverlay />}
        <PageHeader title={title} />
        <VehicleForm
          vehicle={vehicle}
          agencyId={agencyId}
          existingImages={existingImages}
          onSaving={() => setLoading(true)}
        />
      </div>
    </>
  );
}
