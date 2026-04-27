"use client";

import { useState } from "react";

/**
 * Quand on crée un véhicule en quantité >1 (ex: 3 Clio identiques), on a
 * besoin d'une plaque par véhicule. Ce hook tient à jour le tableau des
 * plaques additionnelles (la 1re plaque vient du formulaire principal) en
 * fonction de la quantité saisie + un tableau d'erreurs aligné.
 */
export function useExtraPlates(initialQuantity: number) {
  const [extraPlates, setExtraPlates] = useState<string[]>(
    initialQuantity > 1 ? Array(initialQuantity - 1).fill("") : [],
  );
  const [extraPlateErrors, setExtraPlateErrors] = useState<string[]>([]);

  const handleQuantityChange = (newQty: number) => {
    if (newQty > 1) {
      setExtraPlates((prev) => {
        const needed = newQty - 1;
        if (prev.length < needed) {
          return [...prev, ...Array(needed - prev.length).fill("")];
        }
        return prev.slice(0, needed);
      });
    } else {
      setExtraPlates([]);
    }
  };

  const updatePlate = (index: number, value: string) => {
    setExtraPlates((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (extraPlateErrors[index]) {
      setExtraPlateErrors((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
    }
  };

  /** Valide chaque plaque additionnelle. Renvoie `true` si tout est OK. */
  const validate = (): boolean => {
    const errs = extraPlates.map((p) =>
      p.trim() ? "" : "L'immatriculation est requise",
    );
    if (errs.some(Boolean)) {
      setExtraPlateErrors(errs);
      return false;
    }
    setExtraPlateErrors([]);
    return true;
  };

  return {
    extraPlates,
    extraPlateErrors,
    handleQuantityChange,
    updatePlate,
    validate,
  };
}
