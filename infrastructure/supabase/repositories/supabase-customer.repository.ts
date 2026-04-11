import { createAdminClient } from "../client";
import { toDomainCustomer } from "../mappers";
import type {
  Customer,
  CustomerRepository,
  CreateCustomerInput,
  UpdateCustomerInput,
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

  const findAll = async (
    params?: { search?: string; page?: number; pageSize?: number }
  ): Promise<{ data: Customer[]; count: number }> => {
    const supabase = createAdminClient();
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 15;

    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (!params?.search) {
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);
    }

    const { data, error, count } = await query;
    if (error || !data) return { data: [], count: 0 };

    let results = data.map(toDomainCustomer);

    if (params?.search) {
      const s = params.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.firstName.toLowerCase().includes(s) ||
          c.lastName.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s) ||
          c.phone.includes(s)
      );
      const total = results.length;
      const from = (page - 1) * pageSize;
      results = results.slice(from, from + pageSize);
      return { data: results, count: total };
    }

    return { data: results, count: count ?? 0 };
  };

  const update = async (
    customerId: string,
    input: UpdateCustomerInput
  ): Promise<Customer | null> => {
    const supabase = createAdminClient();
    const patch: Record<string, unknown> = {};
    if (input.firstName !== undefined) patch.first_name = input.firstName;
    if (input.lastName !== undefined) patch.last_name = input.lastName;
    if (input.email !== undefined) patch.email = input.email;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.birthDate !== undefined) patch.birth_date = input.birthDate;
    if (input.birthPlace !== undefined) patch.birth_place = input.birthPlace;
    if (input.address !== undefined) patch.address = input.address;
    if (input.address2 !== undefined) patch.address2 = input.address2;
    if (input.postalCode !== undefined) patch.postal_code = input.postalCode;
    if (input.city !== undefined) patch.city = input.city;
    if (input.country !== undefined) patch.country = input.country;
    if (input.driverLicenseNumber !== undefined)
      patch.driver_license_number = input.driverLicenseNumber;
    if (input.driverLicenseIssuedAt !== undefined)
      patch.driver_license_issued_at = input.driverLicenseIssuedAt;
    if (input.driverLicenseCountry !== undefined)
      patch.driver_license_country = input.driverLicenseCountry;

    const { data, error } = await supabase
      .from("customers")
      .update(patch)
      .eq("id", customerId)
      .select()
      .single();
    if (error || !data) return null;
    return toDomainCustomer(data);
  };

  return { findById, findByEmail, create, findAll, update };
};
