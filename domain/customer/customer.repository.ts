import type { Customer } from "./customer.entity";

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD
  birthPlace?: string | null;
  address: string;
  address2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  driverLicenseNumber?: string | null;
  driverLicenseIssuedAt?: string | null; // YYYY-MM-DD
  driverLicenseCountry?: string | null;
}

export interface CustomerRepository {
  findById(customerId: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  create(input: CreateCustomerInput): Promise<Customer>;
}
