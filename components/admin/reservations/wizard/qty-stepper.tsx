"use client";

import { PiMinus, PiPlus } from "react-icons/pi";

interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

/** Petit composant +/− utilisé dans le wizard pour ajuster la quantité d'une
 *  option. Bornes `min`/`max` garanties par les boutons (pas de saisie libre). */
export function QtyStepper({ value, min, max, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="size-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <PiMinus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="size-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <PiPlus className="size-3.5" />
      </button>
    </div>
  );
}
