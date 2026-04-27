"use client";

import { useState } from "react";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import type {
  InspectionPhoto,
  InspectionReport,
  InspectionType,
} from "@/domain/inspection";
import { useInspectionForm } from "./use-inspection-form";
import { useInspectionPhotos } from "./use-inspection-photos";
import { InspectionFormFields } from "./inspection-form-fields";
import { InspectionPhotosToolbar } from "./inspection-photos-toolbar";
import { InspectionPhotosGrid } from "./inspection-photos-grid";
import { InspectionLightbox } from "./inspection-lightbox";
import { InspectionSignSection } from "./inspection-sign-section";
import {
  InspectionSignedStatus,
  InspectionSignatureImage,
} from "./inspection-signed-status";
import type { PhotoWithUrl } from "./photo-card";

export interface InspectionTabData {
  type: InspectionType;
  report: InspectionReport | null;
  photos: PhotoWithUrl[];
}

// Réexport pour les callers historiques.
export type { PhotoWithUrl, InspectionPhoto };

interface Props {
  bookingId: string;
  agencyId: string;
  data: InspectionTabData;
}

/** Contenu d'un onglet (départ/retour) d'état des lieux : formulaire +
 *  photos + signature. Coordonne les hooks `useInspectionForm` et
 *  `useInspectionPhotos`. */
export function InspectionTab({ bookingId, agencyId, data }: Props) {
  const isSigned = !!data.report?.signedAt;
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);

  const form = useInspectionForm({
    bookingId,
    type: data.type,
    initialReport: data.report,
  });

  const photos = useInspectionPhotos({
    bookingId,
    agencyId,
    serverPhotoCount: data.photos.length,
    ensureReport: form.ensureReport,
  });

  const totalPhotos = data.photos.length;

  return (
    <>
      {photos.loading && <ContentOverlay />}

      {zoomedUrl && (
        <InspectionLightbox
          url={zoomedUrl}
          onClose={() => setZoomedUrl(null)}
        />
      )}

      <div className="space-y-6">
        {isSigned && data.report && (
          <InspectionSignedStatus
            reportId={data.report.id}
            bookingId={bookingId}
            signedAt={data.report.signedAt!}
          />
        )}

        <InspectionFormFields
          mileage={form.mileage}
          setMileage={form.setMileage}
          fuelLevel={form.fuelLevel}
          setFuelLevel={form.setFuelLevel}
          notes={form.notes}
          setNotes={form.setNotes}
          disabled={isSigned}
        />

        <div>
          <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-semibold">Photos ({totalPhotos})</h4>
            {!isSigned && (
              <InspectionPhotosToolbar
                totalPhotos={totalPhotos}
                deleteMode={photos.deleteMode}
                selectedCount={photos.selectedIds.size}
                loading={photos.loading}
                onEnterDeleteMode={() => photos.setDeleteMode(true)}
                onExitDeleteMode={photos.exitDeleteMode}
                onConfirmDelete={photos.handleDeleteSelected}
                onUploadFiles={photos.handleUploadMultiple}
              />
            )}
          </div>

          <InspectionPhotosGrid
            photos={data.photos}
            pendingUploads={photos.pendingUploads}
            refreshing={photos.refreshing}
            isSigned={isSigned}
            deleteMode={photos.deleteMode}
            selectedIds={photos.selectedIds}
            onToggleSelect={photos.toggleSelect}
            onZoom={setZoomedUrl}
            bookingId={bookingId}
          />
        </div>

        {!isSigned && (
          <InspectionSignSection
            signature={form.signature}
            setSignature={form.setSignature}
            totalPhotos={totalPhotos}
            loading={photos.loading}
            onSaveDraft={async () => {
              photos.setLoading(true);
              await form.save();
              photos.setLoading(false);
            }}
            onSign={async () => {
              photos.setLoading(true);
              await form.sign();
              photos.setLoading(false);
            }}
          />
        )}

        {isSigned && data.report?.customerSignature && (
          <InspectionSignatureImage value={data.report.customerSignature} />
        )}
      </div>
    </>
  );
}
