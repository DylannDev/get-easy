import type { Vehicle } from "./vehicle.entity";

/**
 * Port — implemented by infrastructure (e.g. Supabase).
 * The application layer depends only on this interface.
 */
export interface CreateVehicleInput {
  agencyId: string;
  brand: string;
  model: string;
  color: string;
  pricePerDay: number;
  transmission: "automatique" | "manuelle";
  fuelType: "essence" | "diesel" | "électrique" | "hybride";
  numberOfSeats: number;
  numberOfDoors: number;
  trunkSize: string;
  year: number;
  registrationPlate: string;
  quantity: number;
  img: string;
}

export interface UpdateVehicleInput {
  brand?: string;
  model?: string;
  color?: string;
  pricePerDay?: number;
  transmission?: "automatique" | "manuelle";
  fuelType?: "essence" | "diesel" | "électrique" | "hybride";
  numberOfSeats?: number;
  numberOfDoors?: number;
  trunkSize?: string;
  year?: number;
  registrationPlate?: string;
  quantity?: number;
  img?: string;
}

export interface VehicleRepository {
  findById(vehicleId: string): Promise<Vehicle | null>;
  findByAgencyId(agencyId: string): Promise<Vehicle[]>;
  findAll(): Promise<Vehicle[]>;
  create(input: CreateVehicleInput): Promise<Vehicle>;
  update(vehicleId: string, input: UpdateVehicleInput): Promise<Vehicle | null>;
  delete(vehicleId: string): Promise<void>;
}
