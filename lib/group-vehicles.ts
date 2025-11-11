import type { Vehicle } from "@/types";

export interface GroupedVehicle extends Vehicle {
  count: number;
}

/**
 * Regroupe les véhicules identiques selon leur brand, model et color
 * Retourne un tableau de véhicules uniques avec leur quantité
 */
export function groupVehicles(vehicles: Vehicle[]): GroupedVehicle[] {
  const grouped = new Map<string, GroupedVehicle>();

  vehicles.forEach((vehicle) => {
    // Clé unique basée sur brand, model et color
    const key = `${vehicle.brand}-${vehicle.model}-${vehicle.color}`;

    const existing = grouped.get(key);
    if (existing) {
      // Incrémenter le compteur si le véhicule existe déjà
      existing.count += 1;
    } else {
      // Ajouter un nouveau véhicule avec count initial de 1
      grouped.set(key, { ...vehicle, count: 1 });
    }
  });

  return Array.from(grouped.values());
}
