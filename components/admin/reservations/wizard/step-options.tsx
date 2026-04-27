"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";
import { computeOptionLineTotal } from "@/domain/option";
import type { Option } from "@/domain/option";
import { QtyStepper } from "./qty-stepper";

interface Props {
  agencyOptions: Option[];
  selectedOptions: Record<string, number>;
  onOptionQtyChange: (optionId: string, qty: number) => void;
  totalDays: number;
  vehiclePrice: number;
  optionsTotal: number;
  totalPrice: number;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function StepOptions({
  agencyOptions,
  selectedOptions,
  onOptionQtyChange,
  totalDays,
  vehiclePrice,
  optionsTotal,
  totalPrice,
  canGoNext,
  onPrev,
  onNext,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Options additionnelles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {agencyOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune option configurée pour cette agence.
          </p>
        ) : (
          <div className="space-y-3">
            {agencyOptions.map((option) => {
              const qty = selectedOptions[option.id] ?? 0;
              const line = computeOptionLineTotal(
                {
                  unitPrice: option.price,
                  priceType: option.priceType,
                  quantity: qty,
                  monthlyCap: option.capEnabled ? option.monthlyCap : null,
                },
                totalDays,
              );
              return (
                <div
                  key={option.id}
                  className="flex items-start justify-between gap-4 py-3 border-b last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{option.name}</div>
                    {option.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.price.toFixed(2)} €{" "}
                      {option.priceType === "per_day" ? "/ jour" : "forfait"}
                      {qty > 0 && totalDays > 0 && (
                        <span className="ml-2 font-semibold text-foreground">
                          · {line.toFixed(2)} €
                        </span>
                      )}
                    </p>
                  </div>
                  <QtyStepper
                    value={qty}
                    min={0}
                    max={option.maxQuantity}
                    onChange={(v) => onOptionQtyChange(option.id, v)}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Véhicule ({totalDays} j)
            </span>
            <span className="font-semibold">{Math.round(vehiclePrice)} €</span>
          </div>
          {optionsTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Options</span>
              <span className="font-semibold">{optionsTotal.toFixed(2)} €</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t">
            <span className="font-semibold">Total</span>
            <span className="font-bold">{Math.round(totalPrice)} €</span>
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onPrev}>
            <PiCaretLeft className="size-4" />
            Précédent
          </Button>
          <Button type="button" size="sm" disabled={!canGoNext} onClick={onNext}>
            Suivant
            <PiCaretRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
