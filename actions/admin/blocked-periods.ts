"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/infrastructure/supabase/client";

export interface BlockedPeriodRow {
  id: string;
  vehicle_id: string;
  start: string;
  end: string;
  comment?: string;
  created_at: string;
}

export interface BlockedPeriodWithVehicle extends BlockedPeriodRow {
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleRegistrationPlate: string;
  vehicleImg: string;
}

export async function listBlockedPeriods(agencyId?: string): Promise<BlockedPeriodWithVehicle[]> {
  const supabase = createAdminClient();

  let vehicleFilter: string[] | undefined;
  if (agencyId) {
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id")
      .eq("agency_id", agencyId);
    vehicleFilter = vehicles?.map((v) => v.id) ?? [];
    if (vehicleFilter.length === 0) return [];
  }

  let query = supabase
    .from("blocked_periods")
    .select("*, vehicles(brand, model, color, registration_plate, img)")
    .order("start", { ascending: false });

  if (vehicleFilter) {
    query = query.in("vehicle_id", vehicleFilter);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    vehicle_id: row.vehicle_id,
    start: row.start,
    end: row.end,
    comment: row.comment ?? "",
    created_at: row.created_at,
    vehicleBrand: row.vehicles?.brand ?? "",
    vehicleModel: row.vehicles?.model ?? "",
    vehicleColor: row.vehicles?.color ?? "",
    vehicleRegistrationPlate: row.vehicles?.registration_plate ?? "",
    vehicleImg: row.vehicles?.img ?? "",
  }));
}

export async function createBlockedPeriod(input: {
  vehicleId: string;
  start: string;
  end: string;
  comment?: string;
}) {
  const supabase = createAdminClient();
  await supabase.from("blocked_periods").insert({
    vehicle_id: input.vehicleId,
    start: input.start,
    end: input.end,
    comment: input.comment ?? null,
  });
  revalidatePath("/admin/indisponibilites");
}

export async function updateBlockedPeriod(
  id: string,
  input: {
    vehicleId?: string;
    start?: string;
    end?: string;
    comment?: string;
  }
) {
  const supabase = createAdminClient();
  const patch: Record<string, unknown> = {};
  if (input.vehicleId !== undefined) patch.vehicle_id = input.vehicleId;
  if (input.start !== undefined) patch.start = input.start;
  if (input.end !== undefined) patch.end = input.end;
  if (input.comment !== undefined) patch.comment = input.comment;

  await supabase.from("blocked_periods").update(patch).eq("id", id);
  revalidatePath("/admin/indisponibilites");
}

export async function deleteBlockedPeriod(id: string) {
  const supabase = createAdminClient();
  await supabase.from("blocked_periods").delete().eq("id", id);
  revalidatePath("/admin/indisponibilites");
}
