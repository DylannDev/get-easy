import * as React from "react";
import { Label } from "./label";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.ComponentProps<typeof Input> {
  label: string;
  error?: string;
  required?: boolean;
}

function FormField({
  label,
  error,
  required,
  id,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Input
        id={id}
        aria-invalid={!!error}
        className={cn(error && "border-red-500", className)}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export { FormField };
