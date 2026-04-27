"use client";

import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { PiMinus, PiPlus } from "react-icons/pi";
import type { Option } from "@/domain/option";
import { computeOptionLineTotal } from "@/domain/option";
import { formatMoney } from "@/lib/format-money";

interface Props {
  options: Option[];
  selected: Record<string, number>;
  onChange: (optionId: string, quantity: number) => void;
  numberOfDays: number;
}

export const BookingOptionsSelector = ({
  options,
  selected,
  onChange,
  numberOfDays,
}: Props) => {
  if (options.length === 0) return null;

  const formatBasePrice = (o: Option) =>
    o.priceType === "per_day"
      ? `${formatMoney(o.price)} / jour`
      : `${formatMoney(o.price)} forfait`;

  const lineTotal = (o: Option, qty: number) => {
    if (qty <= 0) return 0;
    return computeOptionLineTotal(
      {
        unitPrice: o.price,
        priceType: o.priceType,
        quantity: qty,
        monthlyCap: o.capEnabled ? o.monthlyCap : null,
      },
      numberOfDays,
    );
  };

  return (
    <Card>
      <CardTitle>Options additionnelles</CardTitle>
      <CardContent>
        <div className="space-y-3">
          {options.map((option) => {
            const qty = selected[option.id] ?? 0;
            const total = lineTotal(option, qty);
            return (
              <div
                key={option.id}
                className="flex items-start justify-between gap-4 py-3 border-b border-gray-200 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{option.name}</div>
                  {option.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                    <p>{formatBasePrice(option)}</p>
                    {option.priceType === "per_day" &&
                      option.capEnabled &&
                      option.monthlyCap != null && (
                        <p>
                          Plafonné à {formatMoney(option.monthlyCap)} / mois
                        </p>
                      )}
                    {qty > 0 && numberOfDays > 0 && (
                      <p className="font-semibold text-black">
                        Total : {formatMoney(total)}
                      </p>
                    )}
                  </div>
                </div>

                <QuantityStepper
                  value={qty}
                  min={0}
                  max={option.maxQuantity}
                  onChange={(v) => onChange(option.id, v)}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

function QuantityStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Diminuer"
        className="size-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        <PiMinus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="Augmenter"
        className="size-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        <PiPlus className="size-3.5" />
      </button>
    </div>
  );
}
