import type { Vehicle } from "../vehicle/vehicle.entity";
import type { OpeningHours } from "./opening-hours.vo";

export interface Agency {
  id: string;
  name: string;
  city: string;
  address: string;
  hours: OpeningHours;
  vehicles: Vehicle[];
}
