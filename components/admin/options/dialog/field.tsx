"use client";

import { Label } from "@/components/ui/label";

interface Props {
  label: string;
  error?: string;
  children: React.ReactNode;
}

/** Label + erreur partagé par les champs du formulaire option. */
export function Field({ label, error, children }: Props) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
