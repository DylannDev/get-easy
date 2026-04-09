import type { BookingStatus } from "./booking-status";

export interface Booking {
  id: string;
  customerId: string;
  vehicleId: string;
  agencyId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  expiresAt?: string | null;
}
