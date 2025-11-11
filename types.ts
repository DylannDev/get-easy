export interface BlockedPeriod {
  start: string; // ISO DateTime string, local
  end: string; // ISO DateTime string, local
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  pricePerDay: number;
  numberOfSeats: number;
  numberOfDoors: number;
  trunkSize: string; // e.g., "3 bagages"
  transmission: "automatique" | "manuelle";
  fuelType: "essence" | "diesel" | "électrique" | "hybride";
  color: string;
  quantity: number;
  img: string;
  year: number;
  registrationPlate: string;
  blockedPeriods: BlockedPeriod[];
}

export interface AgencyHours {
  openTime: string; // Format: "HH:mm" (e.g., "08:00")
  closeTime: string; // Format: "HH:mm" (e.g., "19:00")
  interval: number; // Interval in minutes (e.g., 30)
}

export interface Agency {
  id: string;
  name: string;
  city: string;
  address: string;
  hours: AgencyHours;
  vehicles: Vehicle[];
}

export interface Organization {
  id: string;
  name: string;
  agencies: Agency[];
}
