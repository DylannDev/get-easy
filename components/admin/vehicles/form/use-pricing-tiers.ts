"use client";

import { useState } from "react";
import type { Vehicle } from "@/domain/vehicle";

interface TierInput {
  minDays: string;
  pricePerDay: string;
}

/** Encapsule l'état des paliers tarifaires dégressifs (ajouter, supprimer,
 *  mettre à jour). Renvoie aussi la conversion vers les nombres prête pour
 *  `savePricingTiers`. */
export function usePricingTiers(initial: Vehicle["pricingTiers"] | undefined) {
  const [tiers, setTiers] = useState<TierInput[]>(
    initial?.map((t) => ({
      minDays: String(t.minDays),
      pricePerDay: String(t.pricePerDay),
    })) ?? [],
  );

  const addTier = () => {
    const lastMin =
      tiers.length > 0 ? Number(tiers[tiers.length - 1].minDays) + 1 : 1;
    setTiers([...tiers, { minDays: String(lastMin), pricePerDay: "" }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (
    index: number,
    field: "minDays" | "pricePerDay",
    value: string,
  ) => {
    setTiers(tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const toPersistable = () =>
    tiers.map((t) => ({
      minDays: Number(t.minDays) || 1,
      pricePerDay: Number(t.pricePerDay) || 0,
    }));

  return { tiers, addTier, removeTier, updateTier, toPersistable };
}
