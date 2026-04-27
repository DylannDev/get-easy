"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/composition-root/container";

interface UpdateCustomerInput {
  customerId: string;
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

interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function updateCustomerAction(
  input: UpdateCustomerInput
): Promise<ActionResult> {
  const { customerRepository } = getContainer();
  const updated = await customerRepository.update(input.customerId, {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    birthDate: input.birthDate,
    birthPlace: input.birthPlace,
    address: input.address,
    address2: input.address2,
    postalCode: input.postalCode,
    city: input.city,
    country: input.country,
    driverLicenseNumber: input.driverLicenseNumber,
    driverLicenseIssuedAt: input.driverLicenseIssuedAt,
    driverLicenseCountry: input.driverLicenseCountry,
    companyName: input.companyName,
    siret: input.siret,
    vatNumber: input.vatNumber,
  });
  if (!updated) return { ok: false, error: "Client introuvable." };

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${input.customerId}`);
  return { ok: true };
}

export async function deleteCustomerAction(
  customerId: string
): Promise<ActionResult> {
  const { deleteCustomerUseCase } = getContainer();
  const outcome = await deleteCustomerUseCase.execute(customerId);

  switch (outcome.kind) {
    case "deleted":
      revalidatePath("/admin");
      revalidatePath("/admin/clients");
      revalidatePath("/admin/reservations");
      revalidatePath("/admin/documents");
      revalidatePath("/admin/planning");
      return { ok: true };
    case "not_found":
      return { ok: false, error: "Client introuvable." };
    case "error":
      return { ok: false, error: outcome.message };
  }
}
