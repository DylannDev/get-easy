"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "./field";
import { DaySlotsRow } from "./day-slots-row";
import { DAYS, type useScheduleState } from "./use-schedule-state";

interface Props {
  intervalVal: string;
  setIntervalVal: (v: string) => void;
  schedule: ReturnType<typeof useScheduleState>;
}

/** Card "Horaires d'ouverture" : intervalle des créneaux + bascule "tous
 *  les jours" / par jour avec créneaux multiples copiables. La logique
 *  d'état est dans `useScheduleState` — ce composant ne fait qu'orchestrer
 *  le rendu. */
export function ScheduleCard({ intervalVal, setIntervalVal, schedule }: Props) {
  const {
    allDays,
    allSameSlots,
    days,
    handleAllDaysToggle,
    handleDayToggle,
    handleSlotChange,
    addSlot,
    removeSlot,
    copyFrom,
    copyTargets,
    openCopyPopover,
    closeCopyPopover,
    toggleCopyTarget,
    toggleAllCopyTargets,
    applyCopy,
  } = schedule;

  const slotsRowProps = {
    onSlotChange: handleSlotChange,
    onAddSlot: addSlot,
    onRemoveSlot: removeSlot,
    copyFrom,
    copyTargets,
    onOpenCopyPopover: openCopyPopover,
    onCloseCopyPopover: closeCopyPopover,
    onToggleCopyTarget: toggleCopyTarget,
    onToggleAllCopyTargets: toggleAllCopyTargets,
    onApplyCopy: applyCopy,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Horaires d&apos;ouverture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Intervalle des créneaux (minutes)">
          <Input
            value={intervalVal}
            onChange={(e) => setIntervalVal(e.target.value)}
            type="number"
            placeholder="30"
            required
          />
        </Field>
        <div className="flex flex-col gap-3 pb-3 border-b sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Switch
              checked={allDays && allSameSlots}
              onCheckedChange={handleAllDaysToggle}
            />
            <span className="text-sm font-medium">
              Tous les jours (mêmes horaires)
            </span>
          </div>
          {allDays && allSameSlots && (
            <div className="sm:ml-auto">
              <DaySlotsRow
                day={DAYS[0]}
                dayState={days[DAYS[0]]}
                {...slotsRowProps}
              />
            </div>
          )}
        </div>

        {!(allDays && allSameSlots) && (
          <div className="space-y-3">
            {DAYS.map((day) => {
              const dayState = days[day];
              return (
                <div
                  key={day}
                  className={`flex flex-col gap-2 sm:flex-row sm:gap-3 ${dayState.slots.length > 1 ? "sm:items-start" : "sm:items-center"}`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={dayState.enabled}
                      onCheckedChange={(checked) =>
                        handleDayToggle(day, checked)
                      }
                    />
                    <span className="text-sm capitalize sm:w-24 sm:shrink-0">
                      {day}
                    </span>
                  </div>
                  {dayState.enabled ? (
                    <DaySlotsRow
                      day={day}
                      dayState={dayState}
                      {...slotsRowProps}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">Fermé</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
