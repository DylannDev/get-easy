"use client";

interface StepDef {
  num: number;
  label: string;
}

interface Props {
  steps: StepDef[];
  current: number;
}

/** Indicateur d'étapes en haut du wizard de création/édition de réservation.
 *  Les étapes "passées" et "actuelle" sont en noir + texte vert, les futures
 *  en gris. Le libellé n'apparaît qu'à partir de sm. */
export function WizardSteps({ steps, current }: Props) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-1 sm:gap-2">
          <div
            className={`size-8 shrink-0 rounded-full flex items-center justify-center text-sm font-medium ${
              current >= s.num
                ? "bg-black text-green"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {s.num}
          </div>
          <span
            className={`text-sm hidden sm:block ${
              current >= s.num
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className="w-4 sm:w-8 h-px bg-gray-300 mx-0.5 sm:mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}
