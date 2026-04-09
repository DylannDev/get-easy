import type { Database } from "../database.types";
import type { Customer } from "@/domain/customer";

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

export function toDomainCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    birthDate: row.birth_date,
    birthPlace: row.birth_place,
    address: row.address,
    address2: row.address2,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country,
    driverLicenseNumber: row.driver_license_number,
    driverLicenseIssuedAt: row.driver_license_issued_at,
    driverLicenseCountry: row.driver_license_country,
    createdAt: row.created_at,
    userId: row.user_id,
  };
}
