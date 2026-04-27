"use client";

import { useState } from "react";
import { fr } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PiCalendarBlank } from "react-icons/pi";
import { formatDateCayenne } from "@/lib/format-date";

interface Props {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
  /** Date minimale autorisée (ex : la date de retour ne peut pas précéder la
   *  date de départ). Le calendrier désactive tout ce qui est `before`. */
  disabledBefore?: Date;
}

/** Bouton "date" du wizard — ouvre un popover avec un calendrier `<Calendar>`
 *  et affiche la date sélectionnée formatée à la timezone Cayenne. */
export function DatePickerButton({
  value,
  onChange,
  placeholder,
  disabledBefore,
}: Props) {
  const [open, setOpen] = useState(false);
  const minDate = disabledBefore
    ? new Date(
        disabledBefore.getFullYear(),
        disabledBefore.getMonth(),
        disabledBefore.getDate(),
      )
    : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm flex items-center gap-2 cursor-pointer hover:border-gray-400 transition-colors text-left"
        >
          <PiCalendarBlank className="size-4 text-muted-foreground shrink-0" />
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value
              ? formatDateCayenne(value.toISOString(), "dd MMM yyyy")
              : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          disabled={minDate ? { before: minDate } : undefined}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          locale={fr}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
