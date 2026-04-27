"use client";

interface Props {
  label: string;
  value: string;
  /** Affiche la valeur en gras + plus grand (utilisé pour la ligne "Total"). */
  bold?: boolean;
}

/** Ligne d'info "label / value" du récapitulatif final du wizard. */
export function RecapRow({ label, value, bold }: Props) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={`break-words sm:text-right ${bold ? "font-bold text-lg" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}
