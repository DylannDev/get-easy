"use client";

import { Label } from "@/components/ui/label";

interface Props {
  label: string;
  children: React.ReactNode;
}

/** Wrapper Label + input pour les cards de paramètres de l'agence. */
export function Field({ label, children }: Props) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
