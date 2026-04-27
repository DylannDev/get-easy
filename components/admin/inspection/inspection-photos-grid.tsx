"use client";

import { PiImage } from "react-icons/pi";
import { updateInspectionPhotoNote } from "@/actions/admin/inspection";
import { PhotoCard, PendingPhotoCard, type PhotoWithUrl } from "./photo-card";
import type { PendingUpload } from "./use-inspection-photos";

interface Props {
  photos: PhotoWithUrl[];
  pendingUploads: PendingUpload[];
  refreshing: boolean;
  isSigned: boolean;
  deleteMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onZoom: (url: string) => void;
  bookingId: string;
}

/** Grille de photos avec placeholders pendant les uploads. Affiche un état
 *  vide stylisé si aucune photo et aucun upload en cours. */
export function InspectionPhotosGrid({
  photos,
  pendingUploads,
  refreshing,
  isSigned,
  deleteMode,
  selectedIds,
  onToggleSelect,
  onZoom,
  bookingId,
}: Props) {
  const isEmpty = photos.length === 0 && pendingUploads.length === 0;

  if (isEmpty && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 text-muted-foreground">
        <PiImage className="size-6 mb-2" />
        <p className="text-sm">
          Aucune photo. Vous pouvez importez plusieurs photos du véhicule en
          même temps.
        </p>
      </div>
    );
  }

  const showPlaceholders =
    refreshing || pendingUploads.some((p) => !p.done);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isSigned={isSigned}
          deleteMode={deleteMode}
          selected={selectedIds.has(photo.id)}
          onToggleSelect={() => onToggleSelect(photo.id)}
          onZoom={() => onZoom(photo.signedUrl)}
          onNoteBlur={(note) => {
            if (photo.note === note) return;
            updateInspectionPhotoNote(photo.id, note || null, bookingId);
          }}
        />
      ))}
      {showPlaceholders &&
        pendingUploads.map((p) => <PendingPhotoCard key={p.id} item={p} />)}
    </div>
  );
}
