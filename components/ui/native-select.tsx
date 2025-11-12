"use client";

import { forwardRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export interface SelectOption {
  value: string;
  label: string;
}

export interface NativeSelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export const NativeSelect = forwardRef<HTMLButtonElement, NativeSelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder,
      required,
      value,
      onValueChange,
      disabled,
      className,
      id,
      name,
    },
    ref
  ) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          name={name}
        >
          <SelectTrigger
            ref={ref}
            id={id}
            className={`h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              className || ""
            }`}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

NativeSelect.displayName = "NativeSelect";
