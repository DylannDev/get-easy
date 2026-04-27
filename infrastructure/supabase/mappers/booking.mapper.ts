import type { Database } from "../database.types";
import type { Booking, BookingStatus, BookingWithDetails } from "@/domain/booking";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export function toDomainBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    customerId: row.customer_id,
    vehicleId: row.vehicle_id,
    agencyId: row.agency_id,
    startDate: row.start_date,
    endDate: row.end_date,
    totalPrice: row.total_price,
    status: row.status as BookingStatus,
    createdAt: row.created_at,
    expiresAt: (row as BookingRow & { expires_at?: string | null }).expires_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDomainBookingWithDetails(row: any): BookingWithDetails {
  return {
    id: row.id,
    customerId: row.customer_id,
    vehicleId: row.vehicle_id,
    agencyId: row.agency_id,
    startDate: row.start_date,
    endDate: row.end_date,
    totalPrice: row.total_price,
    status: row.status as BookingStatus,
    createdAt: row.created_at,
    customerFirstName: row.customers?.first_name ?? "",
    customerLastName: row.customers?.last_name ?? "",
    customerEmail: row.customers?.email ?? "",
    customerPhone: row.customers?.phone ?? "",
    vehicleBrand: row.vehicles?.brand ?? "",
    vehicleModel: row.vehicles?.model ?? "",
    vehicleColor: row.vehicles?.color ?? "",
    vehicleRegistrationPlate: row.vehicles?.registration_plate ?? "",
  };
}
