export type InspectionType = "departure" | "return";

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  departure: "Départ",
  return: "Retour",
};

export type FuelLevel = "empty" | "1/4" | "1/2" | "3/4" | "full";

export const FUEL_LEVEL_LABELS: Record<FuelLevel, string> = {
  empty: "Vide",
  "1/4": "1/4",
  "1/2": "1/2",
  "3/4": "3/4",
  full: "Plein",
};

export interface InspectionReport {
  id: string;
  bookingId: string;
  type: InspectionType;
  mileage: number | null;
  fuelLevel: FuelLevel | null;
  notes: string | null;
  customerSignature: string | null;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionPhoto {
  id: string;
  reportId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
  note: string | null;
  sortOrder: number;
  createdAt: string;
}
