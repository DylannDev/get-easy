import { createClient } from "./server";
import type { Database } from "./database.types";

type Agency = Database["public"]["Tables"]["agencies"]["Row"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type BlockedPeriod = Database["public"]["Tables"]["blocked_periods"]["Row"];
type PricingTier = Database["public"]["Tables"]["pricing_tiers"]["Row"];

export interface VehicleWithRelations extends Vehicle {
  blockedPeriods: BlockedPeriod[];
  pricingTiers: PricingTier[];
}

export interface AgencyWithVehicles extends Agency {
  vehicles: VehicleWithRelations[];
}

/**
 * Récupère toutes les agences
 */
export async function getAllAgencies(): Promise<Agency[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agencies")
    .select("*")
    .order("name");

  if (error) {
    console.error("❌ Error fetching agencies:", error);
    return [];
  }

  return data || [];
}

/**
 * Récupère une agence par son ID
 */
export async function getAgencyById(agencyId: string): Promise<Agency | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", agencyId)
    .single();

  if (error) {
    console.error("Error fetching agency:", error);
    return null;
  }

  return data;
}

/**
 * Récupère tous les véhicules d'une agence avec leurs relations
 */
export async function getVehiclesByAgencyId(
  agencyId: string
): Promise<VehicleWithRelations[]> {
  const supabase = await createClient();

  // Récupérer les véhicules
  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("agency_id", agencyId)
    .order("brand");

  if (vehiclesError || !vehicles) {
    console.error("Error fetching vehicles:", vehiclesError);
    return [];
  }

  // Pour chaque véhicule, récupérer ses périodes bloquées et paliers tarifaires
  const vehiclesWithRelations = await Promise.all(
    vehicles.map(async (vehicle) => {
      // Récupérer les périodes bloquées
      const { data: blockedPeriods, error: blockedPeriodsError } =
        await supabase
          .from("blocked_periods")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .order("start");

      // Récupérer les paliers tarifaires
      const { data: pricingTiers, error: pricingTiersError } = await supabase
        .from("pricing_tiers")
        .select("*")
        .eq("vehicle_id", vehicle.id)
        .order("min_days");

      if (blockedPeriodsError) {
        console.error("Error fetching blocked periods:", blockedPeriodsError);
      }

      if (pricingTiersError) {
        console.error("Error fetching pricing tiers:", pricingTiersError);
      }

      return {
        ...vehicle,
        blockedPeriods: blockedPeriods || [],
        pricingTiers: pricingTiers || [],
      };
    })
  );

  return vehiclesWithRelations;
}

/**
 * Récupère un véhicule par son ID avec ses relations
 */
export async function getVehicleById(
  vehicleId: string
): Promise<VehicleWithRelations | null> {
  const supabase = await createClient();

  // Récupérer le véhicule
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .single();

  if (vehicleError || !vehicle) {
    console.error("Error fetching vehicle:", vehicleError);
    return null;
  }

  // Récupérer les périodes bloquées
  const { data: blockedPeriods, error: blockedPeriodsError } = await supabase
    .from("blocked_periods")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("start");

  // Récupérer les paliers tarifaires
  const { data: pricingTiers, error: pricingTiersError } = await supabase
    .from("pricing_tiers")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("min_days");

  if (blockedPeriodsError) {
    console.error("Error fetching blocked periods:", blockedPeriodsError);
  }

  if (pricingTiersError) {
    console.error("Error fetching pricing tiers:", pricingTiersError);
  }

  return {
    ...vehicle,
    blockedPeriods: blockedPeriods || [],
    pricingTiers: pricingTiers || [],
  };
}

/**
 * Récupère tous les véhicules disponibles avec leurs relations
 * Filtre optionnellement par date de début et fin
 */
export async function getAvailableVehicles(
  agencyId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<VehicleWithRelations[]> {
  const supabase = await createClient();

  // Construction de la requête de base
  let query = supabase.from("vehicles").select("*").order("brand");

  // Filtrer par agence si fourni
  if (agencyId) {
    query = query.eq("agency_id", agencyId);
  }

  const { data: vehicles, error: vehiclesError } = await query;

  if (vehiclesError || !vehicles) {
    console.error("Error fetching vehicles:", vehiclesError);
    return [];
  }

  // Pour chaque véhicule, récupérer ses relations
  const vehiclesWithRelations = await Promise.all(
    vehicles.map(async (vehicle) => {
      const { data: blockedPeriods } = await supabase
        .from("blocked_periods")
        .select("*")
        .eq("vehicle_id", vehicle.id)
        .order("start");

      const { data: pricingTiers } = await supabase
        .from("pricing_tiers")
        .select("*")
        .eq("vehicle_id", vehicle.id)
        .order("min_days");

      return {
        ...vehicle,
        blockedPeriods: blockedPeriods || [],
        pricingTiers: pricingTiers || [],
      };
    })
  );

  // Filtrer les véhicules disponibles si des dates sont fournies
  if (startDate && endDate) {
    return vehiclesWithRelations.filter((vehicle) => {
      // Vérifier si le véhicule a des périodes bloquées qui chevauchent
      const hasConflict = vehicle.blockedPeriods.some(
        (period: BlockedPeriod) => {
          const periodStart = new Date(period.start);
          const periodEnd = new Date(period.end);

          // Vérifier le chevauchement
          return (
            (startDate >= periodStart && startDate < periodEnd) ||
            (endDate > periodStart && endDate <= periodEnd) ||
            (startDate <= periodStart && endDate >= periodEnd)
          );
        }
      );

      return !hasConflict;
    });
  }

  return vehiclesWithRelations;
}
