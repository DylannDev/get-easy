"use client";

import { useState } from "react";
import {
  PiCheck,
  PiImage,
  PiMagnifyingGlassPlus,
} from "react-icons/pi";
import type { InspectionPhoto } from "@/domain/inspection";

export interface PhotoWithUrl extends InspectionPhoto {
  signedUrl: string;
}

interface Props {
  photo: PhotoWithUrl;
  isSigned: boolean;
  deleteMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onZoom: () => void;
  onNoteBlur: (note: string) => void;
}

/** Vignette d'une photo + champ note inline. En mode "suppression", un
 *  cercle de sélection s'affiche au lieu du bouton zoom. */
export function PhotoCard({
  photo,
  isSigned,
  deleteMode,
  selected,
  onToggleSelect,
  onZoom,
  onNoteBlur,
}: Props) {
  const [note, setNote] = useState(photo.note ?? "");

  return (
    <div
      className={`rounded-lg overflow-hidden bg-white transition-all ${
        deleteMode && selected
          ? "border-2 border-green ring-2 ring-green/20"
          : deleteMode
            ? "border-2 border-transparent hover:border-gray-300"
            : "border border-gray-200"
      }`}
    >
      <div
        className="relative aspect-[4/3] bg-gray-100 cursor-pointer"
        onClick={deleteMode ? onToggleSelect : onZoom}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.signedUrl}
          alt={photo.fileName}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {deleteMode && !isSigned && (
          <div
            className={`absolute top-2 right-2 z-10 size-6 rounded-full flex items-center justify-center ${
              selected
                ? "bg-green text-black"
                : "bg-white border-2 border-gray-300"
            }`}
          >
            {selected && <PiCheck className="size-4" />}
          </div>
        )}
        {!deleteMode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onZoom();
            }}
            className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-black/50 text-white hover:bg-black/70 cursor-pointer transition-colors"
            title="Agrandir"
          >
            <PiMagnifyingGlassPlus className="size-3.5" />
          </button>
        )}
      </div>
      <div className="p-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => onNoteBlur(note)}
          placeholder="Commentaire…"
          disabled={isSigned}
          className="w-full text-xs border-0 border-b border-gray-200 bg-transparent px-0 py-1 focus:outline-none focus:border-black placeholder:text-gray-400 disabled:text-muted-foreground"
        />
      </div>
    </div>
  );
}

interface PendingProps {
  item: { fileName: string; previewUrl: string; done: boolean };
}

/** Vignette "fantôme" affichée pendant qu'un upload est en cours.
 *  Disparaît dès que le router refresh ramène la vraie photo. */
export function PendingPhotoCard({ item }: PendingProps) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <PiImage className="size-8 text-gray-400" />
          {!item.done && (
            <div className="size-6 border-3 border-black/20 border-t-black rounded-full animate-spin" />
          )}
        </div>
      </div>
      <div className="p-2">
        <span className="text-xs text-muted-foreground truncate block">
          {item.done ? "Importé" : "Envoi en cours…"}
        </span>
      </div>
    </div>
  );
}
