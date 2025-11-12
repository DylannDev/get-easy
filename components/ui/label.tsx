import * as React from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-gray-700 mb-1",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export { Label };
