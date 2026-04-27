"use client";

import { NativeSelect } from "@/components/ui/native-select";

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** Select d'heure (00:00 → 23:45 par pas de 15 min) utilisé dans les
 *  créneaux d'ouverture de l'agence. */
export function TimeSelect({ value, onChange }: Props) {
  return (
    <NativeSelect
      value={value}
      onValueChange={onChange}
      options={TIME_SLOTS.map((slot) => ({ value: slot, label: slot }))}
      className="h-9 px-2"
    />
  );
}
