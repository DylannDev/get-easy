import type { BookingStatus } from "./booking-status";

/**
 * Extended booking type that includes customer and vehicle info.
 * Used for admin display to avoid N+1 queries.
 */
export interface BookingWithDetails {
  id: string;
  customerId: string;
  vehicleId: string;
  agencyId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor: string;
}
