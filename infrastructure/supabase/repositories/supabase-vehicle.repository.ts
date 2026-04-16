import { createAdminClient } from "../client";
import { toDomainVehicle, type VehicleRowWithRelations } from "../mappers";
import type {
  Vehicle,
  VehicleRepository,
  CreateVehicleInput,
  UpdateVehicleInput,
} from "@/domain/vehicle";

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

  const create = async (input: CreateVehicleInput): Promise<Vehicle> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        agency_id: input.agencyId,
        brand: input.brand,
        model: input.model,
        color: input.color,
        price_per_day: input.pricePerDay,
        transmission: input.transmission,
        fuel_type: input.fuelType,
        number_of_seats: input.numberOfSeats,
        number_of_doors: input.numberOfDoors,
        trunk_size: input.trunkSize,
        year: input.year,
        registration_plate: input.registrationPlate,
        quantity: input.quantity,
        img: input.img,
        fiscal_power: input.fiscalPower ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      throw new Error(`Failed to create vehicle: ${error?.message ?? "unknown"}`);
    }
    return toDomainVehicle({ ...data, blockedPeriods: [], pricingTiers: [] });
  };

  const update = async (
    vehicleId: string,
    input: UpdateVehicleInput
  ): Promise<Vehicle | null> => {
    const supabase = createAdminClient();
    const patch: Record<string, unknown> = {};
    if (input.brand !== undefined) patch.brand = input.brand;
    if (input.model !== undefined) patch.model = input.model;
    if (input.color !== undefined) patch.color = input.color;
    if (input.pricePerDay !== undefined) patch.price_per_day = input.pricePerDay;
    if (input.transmission !== undefined) patch.transmission = input.transmission;
    if (input.fuelType !== undefined) patch.fuel_type = input.fuelType;
    if (input.numberOfSeats !== undefined) patch.number_of_seats = input.numberOfSeats;
    if (input.numberOfDoors !== undefined) patch.number_of_doors = input.numberOfDoors;
    if (input.trunkSize !== undefined) patch.trunk_size = input.trunkSize;
    if (input.year !== undefined) patch.year = input.year;
    if (input.registrationPlate !== undefined) patch.registration_plate = input.registrationPlate;
    if (input.quantity !== undefined) patch.quantity = input.quantity;
    if (input.img !== undefined) patch.img = input.img;
    if (input.fiscalPower !== undefined) patch.fiscal_power = input.fiscalPower;

    const { data, error } = await supabase
      .from("vehicles")
      .update(patch)
      .eq("id", vehicleId)
      .select()
      .single();
    if (error || !data) return null;
    const relations = await loadRelations(supabase, vehicleId);
    return toDomainVehicle({ ...data, ...relations });
  };

  const deleteVehicle = async (vehicleId: string): Promise<void> => {
    const supabase = createAdminClient();
    await supabase.from("vehicles").delete().eq("id", vehicleId);
  };

  return {
    findById,
    findByAgencyId,
    findAll,
    create,
    update,
    delete: deleteVehicle,
  };
};
