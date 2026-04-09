import type { Vehicle } from "./vehicle.entity";

/**
 * Port — implemented by infrastructure (e.g. Supabase).
 * The application layer depends only on this interface.
 */
export interface VehicleRepository {
  findById(vehicleId: string): Promise<Vehicle | null>;
  findByAgencyId(agencyId: string): Promise<Vehicle[]>;
  findAll(): Promise<Vehicle[]>;
}
