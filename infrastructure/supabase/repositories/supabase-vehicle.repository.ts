import { createAdminClient } from "../client";
import { toDomainVehicle, type VehicleRowWithRelations } from "../mappers";
import type { Vehicle, VehicleRepository } from "@/domain/vehicle";

/**
 * Loads a vehicle's `blocked_periods` and `pricing_tiers` children in
 * parallel and returns the row enriched.
 */
const loadRelations = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  vehicleId: string
): Promise<{
  blockedPeriods: VehicleRowWithRelations["blockedPeriods"];
  pricingTiers: VehicleRowWithRelations["pricingTiers"];
}> => {
  const [blocked, tiers] = await Promise.all([
    supabase
      .from("blocked_periods")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("start"),
    supabase
      .from("pricing_tiers")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("min_days"),
  ]);
  return {
    blockedPeriods: blocked.data || [],
    pricingTiers: tiers.data || [],
  };
};

export const createSupabaseVehicleRepository = (): VehicleRepository => {
  const findById = async (vehicleId: string): Promise<Vehicle | null> => {
    const supabase = createAdminClient();
    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId)
      .single();

    if (error || !vehicle) return null;

    const relations = await loadRelations(supabase, vehicleId);
    return toDomainVehicle({ ...vehicle, ...relations });
  };

  const findByAgencyId = async (agencyId: string): Promise<Vehicle[]> => {
    const supabase = createAdminClient();
    const { data: vehicles, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("agency_id", agencyId)
      .order("brand");

    if (error || !vehicles) return [];

    return Promise.all(
      vehicles.map(async (v) => {
        const relations = await loadRelations(supabase, v.id);
        return toDomainVehicle({ ...v, ...relations });
      })
    );
  };

  const findAll = async (): Promise<Vehicle[]> => {
    const supabase = createAdminClient();
    const { data: vehicles, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("brand");

    if (error || !vehicles) return [];

    return Promise.all(
      vehicles.map(async (v) => {
        const relations = await loadRelations(supabase, v.id);
        return toDomainVehicle({ ...v, ...relations });
      })
    );
  };

  return { findById, findByAgencyId, findAll };
};
