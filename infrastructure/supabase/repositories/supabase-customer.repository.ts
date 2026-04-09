import { createAdminClient } from "../client";
import { toDomainCustomer } from "../mappers";
import type {
  Customer,
  CustomerRepository,
  CreateCustomerInput,
} from "@/domain/customer";

export const createSupabaseCustomerRepository = (): CustomerRepository => {
  const findById = async (customerId: string): Promise<Customer | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();
    if (error || !data) return null;
    return toDomainCustomer(data);
  };

  const findByEmail = async (email: string): Promise<Customer | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (error || !data) return null;
    return toDomainCustomer(data);
  };

  const create = async (input: CreateCustomerInput): Promise<Customer> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        birth_date: input.birthDate,
        birth_place: input.birthPlace ?? null,
        address: input.address,
        address2: input.address2 ?? null,
        postal_code: input.postalCode,
        city: input.city,
        country: input.country,
        driver_license_number: input.driverLicenseNumber ?? null,
        driver_license_issued_at: input.driverLicenseIssuedAt ?? null,
        driver_license_country: input.driverLicenseCountry ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to create customer: ${error?.message ?? "unknown error"}`
      );
    }
    return toDomainCustomer(data);
  };

  return { findById, findByEmail, create };
};
