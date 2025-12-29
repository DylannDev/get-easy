"use client";

import { CalendarIcon, ChevronDownIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useRef } from "react";

interface DateTimePickerMobileProps {
  label: string;
  dateRange: DateRange | undefined;
  onDateRangeChange: (date: DateRange | undefined) => void;
  selectedTime: string | undefined;
  onTimeChange: (time: string) => void;
  timeSlots: string[];
  dateValue: Date | undefined;
  disabledDates?: (date: Date) => boolean;
  calendarMode: "single" | "range";
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;
}

export const DateTimePickerMobile = ({
  label,
  dateRange,
  onDateRangeChange,
  selectedTime,
  onTimeChange,
  timeSlots,
  dateValue,
  disabledDates,
  calendarMode,
  showCalendar,
  setShowCalendar,
}: DateTimePickerMobileProps) => {
  const timeRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="flex items-end gap-3 w-full">
        {/* Date Picker */}
        <div className="flex-1 min-w-[150px] flex flex-col">
          <label className="block text-xs text-gray font-medium mb-1.5">
            {label}
          </label>
          <Button
            type="button"
            variant="ghost"
            size="ghost"
            onClick={() => setShowCalendar(true)}
            className={cn(
              "w-full justify-between text-left text-base font-normal cursor-pointer pb-3",
              !dateValue && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1">
              <CalendarIcon className="size-4" />
              {dateValue ? (
                dateValue.toLocaleDateString("fr-FR")
              ) : (
                <span>Sélectionner</span>
              )}
            </div>
            <ChevronDownIcon className="size-4 opacity-50" />
          </Button>
        </div>

        {/* Time Picker */}
        <div className="flex-1">
          <label className="block text-xs text-gray font-medium mb-1.5 sr-only">
            Heure
          </label>
          <Select value={selectedTime} onValueChange={onTimeChange}>
            <SelectTrigger
              ref={timeRef}
              className={cn(
                "w-full cursor-pointer pb-3",
                !selectedTime && "[&_svg]:opacity-50"
              )}
            >
              {selectedTime ? (
                <SelectValue />
              ) : (
                <span className="text-muted-foreground">Heure</span>
              )}
            </SelectTrigger>
            <SelectContent sideOffset={4} className="z-9999">
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Full screen calendar */}
      {showCalendar && (
        <div className="fixed inset-0 z-9999 bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">{label}</h3>
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="p-1 bg-black rounded-md"
              aria-label="Fermer"
            >
              <X className="size-5 text-green" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 h-full">
            <div className="flex flex-col items-center gap-6">
              {/* Calendar */}
              {calendarMode === "single" ? (
                <Calendar
                  mode="single"
                  selected={dateValue}
                  onSelect={(date) => {
                    if (date) {
                      onDateRangeChange({ from: date, to: date });
                      setShowCalendar(false);
                      // Ouvrir automatiquement le sélecteur d'heure
                      setTimeout(() => timeRef.current?.click(), 100);
                    }
                  }}
                  numberOfMonths={2}
                  locale={fr}
                  weekStartsOn={1}
                  showOutsideDays={false}
                  formatters={{
                    formatCaption: (date) => {
                      const month = date.toLocaleDateString("fr-FR", {
                        month: "long",
                      });
                      const year = date.getFullYear();
                      return (
                        month.charAt(0).toUpperCase() +
                        month.slice(1) +
                        " " +
                        year
                      );
                    },
                    formatWeekdayName: (date) => {
                      const day = date.toLocaleDateString("fr-FR", {
                        weekday: "short",
                      });
                      return (
                        day.replace(".", "").charAt(0).toUpperCase() +
                        day.replace(".", "").slice(1)
                      );
                    },
                  }}
                  disabled={(date) => {
                    const today = new Date(new Date().setHours(0, 0, 0, 0));
                    const isPast = date < today;
                    const isBlocked = disabledDates
                      ? disabledDates(date)
                      : false;
                    return isPast || isBlocked;
                  }}
                />
              ) : (
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    onDateRangeChange(range);
                    if (range?.from && range?.to) {
                      setShowCalendar(false);
                      // Ouvrir automatiquement le sélecteur d'heure
                      setTimeout(() => timeRef.current?.click(), 100);
                    }
                  }}
                  numberOfMonths={2}
                  locale={fr}
                  weekStartsOn={1}
                  showOutsideDays={false}
                  formatters={{
                    formatCaption: (date) => {
                      const month = date.toLocaleDateString("fr-FR", {
                        month: "long",
                      });
                      const year = date.getFullYear();
                      return (
                        month.charAt(0).toUpperCase() +
                        month.slice(1) +
                        " " +
                        year
                      );
                    },
                    formatWeekdayName: (date) => {
                      const day = date.toLocaleDateString("fr-FR", {
                        weekday: "short",
                      });
                      return (
                        day.replace(".", "").charAt(0).toUpperCase() +
                        day.replace(".", "").slice(1)
                      );
                    },
                  }}
                  disabled={(date) => {
                    const today = new Date(new Date().setHours(0, 0, 0, 0));
                    const isPast = date < today;
                    const isBlocked = disabledDates
                      ? disabledDates(date)
                      : false;
                    return isPast || isBlocked;
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
