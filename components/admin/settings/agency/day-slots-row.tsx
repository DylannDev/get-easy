"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PiPlus, PiX, PiCopy } from "react-icons/pi";
import { TimeSelect } from "./time-select";
import { DAYS, type DayState } from "./use-schedule-state";

interface Props {
  day: string;
  dayState: DayState;
  onSlotChange: (
    day: string,
    slotIndex: number,
    field: "openTime" | "closeTime",
    value: string,
  ) => void;
  onAddSlot: (day: string) => void;
  onRemoveSlot: (day: string, slotIndex: number) => void;

  copyFrom: string | null;
  copyTargets: Set<string>;
  onOpenCopyPopover: (day: string) => void;
  onCloseCopyPopover: () => void;
  onToggleCopyTarget: (day: string) => void;
  onToggleAllCopyTargets: () => void;
  onApplyCopy: () => void;
}

/** Liste des créneaux d'un jour (1..N) avec boutons +/x/copier. Le bouton
 *  "copier" ouvre un popover où l'utilisateur choisit les jours cibles. */
export function DaySlotsRow({
  day,
  dayState,
  onSlotChange,
  onAddSlot,
  onRemoveSlot,
  copyFrom,
  copyTargets,
  onOpenCopyPopover,
  onCloseCopyPopover,
  onToggleCopyTarget,
  onToggleAllCopyTargets,
  onApplyCopy,
}: Props) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {dayState.slots.map((slot, i) => (
        <div key={i} className="flex items-center gap-1 flex-wrap">
          <TimeSelect
            value={slot.openTime}
            onChange={(v) => onSlotChange(day, i, "openTime", v)}
          />
          <span className="text-xs text-muted-foreground">—</span>
          <TimeSelect
            value={slot.closeTime}
            onChange={(v) => onSlotChange(day, i, "closeTime", v)}
          />
          {dayState.slots.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveSlot(day, i)}
              className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <PiX className="size-3.5" />
            </button>
          )}
          {i === dayState.slots.length - 1 && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onAddSlot(day)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                    >
                      <PiPlus className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ajouter un créneau horaire</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Popover
                open={copyFrom === day}
                onOpenChange={(open) => {
                  if (open) onOpenCopyPopover(day);
                  else onCloseCopyPopover();
                }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <PopoverTrigger asChild>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                        >
                          <PiCopy className="size-4" />
                        </button>
                      </TooltipTrigger>
                    </PopoverTrigger>
                    <TooltipContent>
                      <p>Copier les créneaux vers</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <PopoverContent className="w-56 p-0" align="start">
                  <div className="p-3">
                    <p className="text-xs font-medium uppercase text-muted-foreground pb-3">
                      Copier les créneaux vers
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 rounded-md p-1 hover:bg-muted cursor-pointer">
                        <Checkbox
                          checked={copyTargets.size === DAYS.length - 1}
                          onCheckedChange={onToggleAllCopyTargets}
                        />
                        <span className="text-sm font-medium">
                          Tout sélectionner
                        </span>
                      </label>
                      {DAYS.map((d) => {
                        const isCurrent = d === day;
                        return (
                          <label
                            key={d}
                            className={`flex items-center gap-2 rounded-md p-1 capitalize ${
                              isCurrent
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-muted cursor-pointer"
                            }`}
                          >
                            <Checkbox
                              checked={isCurrent || copyTargets.has(d)}
                              disabled={isCurrent}
                              onCheckedChange={() => {
                                if (!isCurrent) onToggleCopyTarget(d);
                              }}
                            />
                            <span className="text-sm">{d}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t flex justify-end gap-2 p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={onCloseCopyPopover}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      disabled={copyTargets.size === 0}
                      onClick={onApplyCopy}
                    >
                      Appliquer
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
