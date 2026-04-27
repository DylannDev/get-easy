"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PiPlus, PiX } from "react-icons/pi";

interface Tier {
  minDays: string;
  pricePerDay: string;
}

interface Props {
  tiers: Tier[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (
    index: number,
    field: "minDays" | "pricePerDay",
    value: string,
  ) => void;
}

/** Card "Tarifs dégressifs" : ajoute des paliers (à partir de N jours,
 *  prix/jour). Si vide, le prix de base s'applique sur toute la durée. */
export function VehiclePricingTiersCard({
  tiers,
  onAdd,
  onRemove,
  onUpdate,
}: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Tarifs dégressifs</CardTitle>
        <Button
          type="button"
          variant="default"
          size="xs"
          className="w-full sm:w-auto"
          onClick={onAdd}
        >
          <PiPlus className="size-3" />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        {tiers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun tarif dégressif. Le prix de base sera utilisé.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_1fr_40px] gap-3 text-xs text-muted-foreground font-medium">
              <span>À partir de (jours)</span>
              <span>Prix / jour (€)</span>
              <span />
            </div>
            {tiers.map((tier, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_1fr_40px] gap-3 items-center"
              >
                <Input
                  type="number"
                  min={1}
                  value={tier.minDays}
                  onChange={(e) => onUpdate(i, "minDays", e.target.value)}
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={tier.pricePerDay}
                  onChange={(e) => onUpdate(i, "pricePerDay", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                >
                  <PiX className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
