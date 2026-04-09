import type { Database } from "../database.types";
import type { Booking, BookingStatus } from "@/domain/booking";

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
