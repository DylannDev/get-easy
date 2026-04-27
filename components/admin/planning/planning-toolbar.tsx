"use client";

import { PiCaretLeft, PiCaretRight } from "react-icons/pi";
import { VIEW_MODES, type ViewMode } from "./planning-constants";

interface Props {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  periodLabel: string;
  onNavigate: (dir: 1 | -1) => void;
  /** Active les flèches de navigation (uniquement en vue jour/semaine). */
  showNav: boolean;
}

const LEGEND = [
  { color: "bg-[#ccff33]", label: "En cours" },
  { color: "bg-[#93c5fd]", label: "À venir" },
  { color: "bg-[#a1a1aa]", label: "Finalisée" },
  { color: "bg-[#fbbf24]", label: "En attente" },
];

/** Barre supérieure du planning : navigation période + sélecteur de mode
 *  (Jour/Semaine/Mois/Année) + légende des couleurs de statut. */
export function PlanningToolbar({
  viewMode,
  setViewMode,
  periodLabel,
  onNavigate,
  showNav,
}: Props) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:flex-wrap">
      <div className="flex items-center gap-3">
        {showNav && (
          <button
            onClick={() => onNavigate(-1)}
            className="h-9 w-9 shrink-0 rounded-md border border-gray-300 bg-white flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <PiCaretLeft className="size-4" />
          </button>
        )}
        <span className="text-sm font-medium flex-1 min-w-[160px] sm:min-w-[220px] text-center capitalize">
          {periodLabel}
        </span>
        {showNav && (
          <button
            onClick={() => onNavigate(1)}
            className="h-9 w-9 shrink-0 rounded-md border border-gray-300 bg-white flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <PiCaretRight className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 sm:flex-wrap">
        <div className="flex items-center gap-1 rounded-md border border-gray-300 p-1 self-start sm:self-auto">
          {VIEW_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setViewMode(m.value)}
              className={`px-3 py-1.5 text-sm rounded-sm cursor-pointer transition-colors ${
                viewMode === m.value
                  ? "bg-black text-green font-medium"
                  : "text-muted-foreground hover:bg-gray-50"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs flex-wrap">
          {LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`size-3 rounded-sm ${item.color}`} />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
