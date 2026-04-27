"use client";

import { Label } from "@/components/ui/label";

interface Props {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}

/** Wrapper Label + input + erreur, partagé par tous les sous-composants
 *  de champs client. Lib-agnostique : ne dépend pas de react-hook-form. */
export function Field({ label, children, error, required }: Props) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground" required={required}>
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
