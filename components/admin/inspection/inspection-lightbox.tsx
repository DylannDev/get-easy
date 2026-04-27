"use client";

import { PiX } from "react-icons/pi";

interface Props {
  url: string;
  onClose: () => void;
}

/** Lightbox plein écran (cliquer hors de l'image ou sur le X pour fermer). */
export function InspectionLightbox({ url, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer transition-colors"
      >
        <PiX className="size-6" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Zoom"
        className="max-w-full max-h-full object-contain rounded"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
