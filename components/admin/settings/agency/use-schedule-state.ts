"use client";

import { useState } from "react";
import type { TimeSlot, WeekSchedule } from "@/domain/agency";

export const DAYS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

export type DayName = (typeof DAYS)[number];

export interface DayState {
  enabled: boolean;
  slots: TimeSlot[];
}

const DEFAULT_SLOT: TimeSlot = { openTime: "07:00", closeTime: "22:00" };

const DEFAULT_SCHEDULE: WeekSchedule = {
  allDays: true,
  days: Object.fromEntries(
    DAYS.map((d) => [
      d,
      {
        enabled: true,
        openTime: DEFAULT_SLOT.openTime,
        closeTime: DEFAULT_SLOT.closeTime,
        slots: [{ ...DEFAULT_SLOT }],
      },
    ]),
  ),
};

function dayFromSchedule(schedule: WeekSchedule, day: string): DayState {
  const d = schedule.days[day];
  if (!d) return { enabled: false, slots: [{ ...DEFAULT_SLOT }] };
  const slots =
    d.slots && d.slots.length > 0
      ? d.slots
      : [{ openTime: d.openTime, closeTime: d.closeTime }];
  return { enabled: d.enabled, slots };
}

const slotsEqual = (a: TimeSlot[], b: TimeSlot[]) =>
  a.length === b.length &&
  a.every(
    (s, i) => s.openTime === b[i].openTime && s.closeTime === b[i].closeTime,
  );

/**
 * Encapsule l'état + tous les handlers de l'éditeur d'horaires d'ouverture
 * (tous les jours / par jour, créneaux multiples, copier-coller entre jours).
 * Renvoie une `WeekSchedule` prête pour `updateAgency` via `buildSchedule()`.
 */
export function useScheduleState(initial: WeekSchedule | null | undefined) {
  const init = initial ?? DEFAULT_SCHEDULE;
  const [allDays, setAllDays] = useState(init.allDays);
  const [days, setDays] = useState<Record<string, DayState>>(
    Object.fromEntries(DAYS.map((d) => [d, dayFromSchedule(init, d)])),
  );

  // États du popover "Copier les créneaux vers".
  const [copyFrom, setCopyFrom] = useState<string | null>(null);
  const [copyTargets, setCopyTargets] = useState<Set<string>>(new Set());

  const allEnabled = DAYS.every((d) => days[d].enabled);
  const allSameSlots =
    allEnabled &&
    DAYS.every((d) => slotsEqual(days[d].slots, days[DAYS[0]].slots));

  const handleAllDaysToggle = (checked: boolean) => {
    setAllDays(checked);
    if (checked) {
      const ref = days[DAYS[0]].slots;
      setDays((prev) => {
        const updated = { ...prev };
        for (const d of DAYS) {
          updated[d] = { enabled: true, slots: ref.map((s) => ({ ...s })) };
        }
        return updated;
      });
    }
  };

  const handleDayToggle = (day: string, enabled: boolean) => {
    setAllDays(false);
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled,
        slots:
          prev[day].slots.length > 0 ? prev[day].slots : [{ ...DEFAULT_SLOT }],
      },
    }));
  };

  const handleSlotChange = (
    day: string,
    slotIndex: number,
    field: "openTime" | "closeTime",
    value: string,
  ) => {
    if (allDays && allSameSlots) {
      setDays((prev) => {
        const updated = { ...prev };
        for (const d of DAYS) {
          const newSlots = [...updated[d].slots];
          newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
          updated[d] = { ...updated[d], slots: newSlots };
        }
        return updated;
      });
    } else {
      setDays((prev) => {
        const newSlots = [...prev[day].slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
        return { ...prev, [day]: { ...prev[day], slots: newSlots } };
      });
    }
  };

  const addSlot = (day: string) => {
    setDays((prev) => {
      const lastSlot = prev[day].slots[prev[day].slots.length - 1];
      const newSlot: TimeSlot = {
        openTime: lastSlot?.closeTime ?? "12:00",
        closeTime: "18:00",
      };
      return {
        ...prev,
        [day]: { ...prev[day], slots: [...prev[day].slots, newSlot] },
      };
    });
  };

  const removeSlot = (day: string, slotIndex: number) => {
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== slotIndex),
      },
    }));
  };

  const openCopyPopover = (day: string) => {
    setCopyFrom(day);
    setCopyTargets(new Set());
  };

  const closeCopyPopover = () => {
    setCopyFrom(null);
    setCopyTargets(new Set());
  };

  const toggleCopyTarget = (day: string) => {
    setCopyTargets((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const toggleAllCopyTargets = () => {
    const otherDays = DAYS.filter((d) => d !== copyFrom);
    if (copyTargets.size === otherDays.length) {
      setCopyTargets(new Set());
    } else {
      setCopyTargets(new Set(otherDays));
    }
  };

  const applyCopy = () => {
    if (!copyFrom) return;
    const sourceSlots = days[copyFrom].slots;
    setDays((prev) => {
      const updated = { ...prev };
      for (const target of copyTargets) {
        updated[target] = {
          enabled: true,
          slots: sourceSlots.map((s) => ({ ...s })),
        };
      }
      return updated;
    });
    closeCopyPopover();
  };

  const buildSchedule = (): WeekSchedule => ({
    allDays: allDays && allSameSlots,
    days: Object.fromEntries(
      DAYS.map((d) => [
        d,
        {
          enabled: days[d].enabled,
          openTime: days[d].slots[0]?.openTime ?? "07:00",
          closeTime:
            days[d].slots[days[d].slots.length - 1]?.closeTime ?? "22:00",
          slots: days[d].slots,
        },
      ]),
    ),
  });

  return {
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
    buildSchedule,
  };
}
