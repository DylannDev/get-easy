"use client";

import { forwardRef } from "react";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  label: string;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selectedTime: string | undefined;
  onTimeChange: (time: string) => void;
  timeSlots: string[];
  dateValue: Date | undefined;
  openCalendar: boolean;
  onOpenCalendarChange: (open: boolean) => void;
  timeRef?: React.RefObject<HTMLButtonElement | null>;
  disabledDates?: (date: Date) => boolean;
  showBorder?: boolean;
  calendarMode?: "range" | "single";
  timePickerClassName?: string;
}

export const DateTimePicker = forwardRef<
  HTMLButtonElement,
  DateTimePickerProps
>(
  (
    {
      label,
      dateRange,
      onDateRangeChange,
      selectedTime,
      onTimeChange,
      timeSlots,
      dateValue,
      openCalendar,
      onOpenCalendarChange,
      timeRef,
      disabledDates,
      showBorder = false,
      calendarMode = "range",
      timePickerClassName,
    },
    ref
  ) => {
    return (
      <div className="flex items-end gap-3 w-1/3">
        {/* Date Picker */}
        <div className="flex-1 min-w-[150px] flex flex-col">
          <label className="block text-xs text-gray font-medium mb-1.5">
            {label}
          </label>
          <Popover open={openCalendar} onOpenChange={onOpenCalendarChange}>
            <PopoverTrigger asChild>
              <Button
                ref={ref}
                variant="ghost"
                size="ghost"
                className={cn(
                  "w-full justify-between text-left text-base font-normal cursor-pointer",
                  !dateValue && "text-muted-foreground",
                  showBorder && "border border-gray-300 rounded-md p-2"
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
            </PopoverTrigger>
            <PopoverContent sideOffset={20} className="w-auto" align="center">
              {calendarMode === "single" ? (
                <Calendar
                  mode="single"
                  selected={dateValue}
                  onSelect={(date) => {
                    if (date) {
                      // Pass a range object with only the selected date
                      // The parent component will handle updating from or to
                      onDateRangeChange({ from: date, to: date });
                    }
                  }}
                  numberOfMonths={2}
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
                  onSelect={onDateRangeChange}
                  numberOfMonths={2}
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
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Picker */}
        <div className={cn("flex-1", timePickerClassName)}>
          <label className="block text-xs text-gray font-medium mb-1.5 sr-only">
            {label}
          </label>
          <Select value={selectedTime} onValueChange={onTimeChange}>
            <SelectTrigger
              ref={timeRef}
              className={cn(
                "w-full cursor-pointer",
                showBorder && "border border-gray-300 rounded-md p-2",
                !selectedTime && "[&_svg]:opacity-50"
              )}
            >
              {selectedTime ? (
                <SelectValue />
              ) : (
                <span className="text-muted-foreground">Heure</span>
              )}
            </SelectTrigger>
            <SelectContent sideOffset={16}>
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }
);

DateTimePicker.displayName = "DateTimePicker";
