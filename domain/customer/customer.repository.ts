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
  companyName?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
}

export interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  birthPlace?: string | null;
  address?: string;
  address2?: string | null;
  postalCode?: string;
  city?: string;
  country?: string;
  driverLicenseNumber?: string | null;
  driverLicenseIssuedAt?: string | null;
  driverLicenseCountry?: string | null;
  companyName?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
}

export interface CustomerRepository {
  findById(customerId: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  create(input: CreateCustomerInput): Promise<Customer>;
  findAll(params?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Customer[]; count: number }>;
  update(
    customerId: string,
    input: UpdateCustomerInput
  ): Promise<Customer | null>;
  /** Hard-delete d'un client. Cascade DB sur `bookings` et
   *  `customer_documents` mais bloquée par `quotes` (FK RESTRICT). */
  delete(customerId: string): Promise<void>;
}
