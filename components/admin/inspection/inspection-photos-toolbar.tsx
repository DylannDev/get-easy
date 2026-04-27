"use client";

import { Button } from "@/components/ui/button";
import { PiCamera, PiTrash, PiUpload } from "react-icons/pi";

interface Props {
  totalPhotos: number;
  deleteMode: boolean;
  selectedCount: number;
  loading: boolean;

  onEnterDeleteMode: () => void;
  onExitDeleteMode: () => void;
  onConfirmDelete: () => void;
  onUploadFiles: (files: File[]) => void;
}

/** Barre d'actions au-dessus de la grille de photos : prendre photo,
 *  importer, basculer en mode suppression, confirmer suppression. */
export function InspectionPhotosToolbar({
  totalPhotos,
  deleteMode,
  selectedCount,
  loading,
  onEnterDeleteMode,
  onExitDeleteMode,
  onConfirmDelete,
  onUploadFiles,
}: Props) {
  if (deleteMode) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <Button
          type="button"
          variant="red"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onConfirmDelete}
          disabled={loading || selectedCount === 0}
        >
          <PiTrash className="size-4" />
          {selectedCount > 0
            ? `Confirmer (${selectedCount})`
            : "Supprimer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onExitDeleteMode}
        >
          Annuler
        </Button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    onUploadFiles(files);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
      <Button type="button" variant="default" size="sm" className="w-full sm:w-auto" asChild>
        <label className="cursor-pointer">
          <PiCamera className="size-4" />
          Prendre une photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleChange}
          />
        </label>
      </Button>
      <Button type="button" variant="default" size="sm" className="w-full sm:w-auto" asChild>
        <label className="cursor-pointer">
          <PiUpload className="size-4" />
          Importer des photos
          <input
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            multiple
            onChange={handleChange}
          />
        </label>
      </Button>
      {totalPhotos > 0 && (
        <Button
          type="button"
          variant="red"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onEnterDeleteMode}
        >
          <PiTrash className="size-4" />
          Supprimer
        </Button>
      )}
    </div>
  );
}
