"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContainer } from "@/composition-root/container";
import { createAdminClient } from "@/infrastructure/supabase/client";
import type { CreateVehicleInput, UpdateVehicleInput } from "@/domain/vehicle";

export async function createVehicle(input: CreateVehicleInput) {
  const { vehicleRepository } = getContainer();
  await vehicleRepository.create(input);
  revalidatePath("/admin/vehicules");
  redirect("/admin/vehicules");
}

export async function createMultipleVehicles(
  baseInput: Omit<CreateVehicleInput, "quantity" | "registrationPlate">,
  plates: string[]
) {
  const { vehicleRepository } = getContainer();
  for (const plate of plates) {
    await vehicleRepository.create({
      ...baseInput,
      registrationPlate: plate,
      quantity: 1,
    });
  }
  revalidatePath("/admin/vehicules");
  redirect("/admin/vehicules");
}

export async function updateVehicle(
  vehicleId: string,
  input: UpdateVehicleInput
) {
  const { vehicleRepository } = getContainer();
  await vehicleRepository.update(vehicleId, input);
  revalidatePath(`/admin/vehicules/${vehicleId}`);
  revalidatePath("/admin/vehicules");
}

export async function deleteVehicle(vehicleId: string) {
  const { vehicleRepository } = getContainer();
  await vehicleRepository.delete(vehicleId);
  revalidatePath("/admin/vehicules");
  redirect("/admin/vehicules");
}

export async function deleteMultipleVehicles(vehicleIds: string[]) {
  const { vehicleRepository } = getContainer();
  for (const id of vehicleIds) {
    await vehicleRepository.delete(id);
  }
  revalidatePath("/admin/vehicules");
}

export async function duplicateVehicle(vehicleId: string) {
  const { vehicleRepository } = getContainer();
  const source = await vehicleRepository.findById(vehicleId);
  if (!source) throw new Error("Véhicule introuvable");

  const copy = await vehicleRepository.create({
    agencyId: source.agencyId,
    brand: source.brand,
    model: source.model,
    color: source.color,
    pricePerDay: source.pricePerDay,
    transmission: source.transmission,
    fuelType: source.fuelType,
    numberOfSeats: source.numberOfSeats,
    numberOfDoors: source.numberOfDoors,
    trunkSize: source.trunkSize,
    year: source.year,
    registrationPlate: `${source.registrationPlate} (copie)`,
    quantity: source.quantity,
    img: source.img,
  });

  // Duplicate pricing tiers
  if (source.pricingTiers.length > 0) {
    const supabase = createAdminClient();
    const tierRows = source.pricingTiers.map((t) => ({
      vehicle_id: copy.id,
      min_days: t.minDays,
      price_per_day: t.pricePerDay,
    }));
    await supabase.from("pricing_tiers").insert(tierRows);
  }

  revalidatePath("/admin/vehicules");
  redirect(`/admin/vehicules/${copy.id}`);
}
