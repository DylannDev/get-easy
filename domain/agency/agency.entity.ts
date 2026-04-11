import type { Vehicle } from "../vehicle/vehicle.entity";
import type { OpeningHours } from "./opening-hours.vo";

export interface TimeSlot {
  openTime: string;
  closeTime: string;
}

export interface DaySchedule {
  enabled: boolean;
  /** @deprecated Use slots instead */
  openTime: string;
  /** @deprecated Use slots instead */
  closeTime: string;
  slots?: TimeSlot[];
}

export interface WeekSchedule {
  allDays: boolean;
  days: Record<string, DaySchedule>;
}

export interface Agency {
  id: string;
  name: string;
  city: string;
  address: string;
  hours: OpeningHours;
  phone?: string;
  email?: string;
  deliveryLabel?: string;
  deliveryZones?: string;
  schedule?: WeekSchedule;
  vehicles: Vehicle[];
}
