"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/infrastructure/supabase/client";

interface TierInput {
  minDays: number;
  pricePerDay: number;
}

export async function savePricingTiers(
  vehicleId: string,
  tiers: TierInput[]
) {
  const supabase = createAdminClient();

  // Delete existing tiers
  await supabase
    .from("pricing_tiers")
    .delete()
    .eq("vehicle_id", vehicleId);

  // Insert new tiers
  if (tiers.length > 0) {
    const rows = tiers.map((t) => ({
      vehicle_id: vehicleId,
      min_days: t.minDays,
      price_per_day: t.pricePerDay,
    }));
    await supabase.from("pricing_tiers").insert(rows);
  }

  revalidatePath(`/admin/vehicules/${vehicleId}`);
}
