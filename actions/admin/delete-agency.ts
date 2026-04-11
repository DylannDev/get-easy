"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/infrastructure/supabase/client";

export async function deleteAgency(agencyId: string) {
  const supabase = createAdminClient();

  // Delete all related data
  // 1. Get all vehicles for this agency
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id")
    .eq("agency_id", agencyId);

  if (vehicles && vehicles.length > 0) {
    const vehicleIds = vehicles.map((v) => v.id);

    // Delete blocked periods
    await supabase
      .from("blocked_periods")
      .delete()
      .in("vehicle_id", vehicleIds);

    // Delete pricing tiers
    await supabase
      .from("pricing_tiers")
      .delete()
      .in("vehicle_id", vehicleIds);

    // Delete payments for bookings of this agency
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("agency_id", agencyId);

    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map((b) => b.id);
      await supabase.from("payments").delete().in("booking_id", bookingIds);
    }

    // Delete bookings
    await supabase.from("bookings").delete().eq("agency_id", agencyId);

    // Delete vehicles
    await supabase.from("vehicles").delete().eq("agency_id", agencyId);
  }

  // Delete the agency
  await supabase.from("agencies").delete().eq("id", agencyId);

  revalidatePath("/admin/infos-agence");
}
