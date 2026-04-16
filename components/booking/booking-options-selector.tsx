"use client";

import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { PiMinus, PiPlus } from "react-icons/pi";
import type { Option } from "@/domain/option";

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

  const formatPrice = (o: Option) => {
    if (o.priceType === "per_day") {
      return `${o.price.toFixed(2)} € / jour`;
    }
    return `${o.price.toFixed(2)} € forfait`;
  };

  const lineTotal = (o: Option, qty: number) => {
    if (qty <= 0) return 0;
    return o.priceType === "per_day"
      ? o.price * qty * numberOfDays
      : o.price * qty;
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
                  <p className="text-xs text-gray-600 mt-1">
                    {formatPrice(option)}
                    {qty > 0 && numberOfDays > 0 && (
                      <span className="ml-2 font-semibold text-black">
                        · {total.toFixed(2)} €
                      </span>
                    )}
                  </p>
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
