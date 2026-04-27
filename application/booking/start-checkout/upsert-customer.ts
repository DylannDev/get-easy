import type { Customer, CustomerRepository } from "@/domain/customer";
import { buildB2BPatch, toCreateCustomerInput } from "./customer-mapping";
import type { CheckoutCustomerData } from "./types";

type Result =
  | { ok: true; customer: Customer }
  | { ok: false; error: string };

/**
 * Trouve un client par email, ou le crée. Si le client existe déjà et
 * coche "Je suis un professionnel" cette fois-ci, on met à jour ses
 * champs B2B (companyName/siret/vatNumber) sans toucher au reste.
 */
export async function upsertCustomer(
  customerRepository: CustomerRepository,
  data: CheckoutCustomerData,
): Promise<Result> {
  let customer = await customerRepository.findByEmail(data.email);

  if (!customer) {
    try {
      customer = await customerRepository.create(toCreateCustomerInput(data));
    } catch (e) {
      return {
        ok: false,
        error: `Impossible de créer le client: ${
          e instanceof Error ? e.message : "Erreur inconnue"
        }`,
      };
    }
    return { ok: true, customer };
  }

  if (data.isBusiness) {
    const updated = await customerRepository.update(
      customer.id,
      buildB2BPatch(data),
    );
    if (updated) customer = updated;
  }

  return { ok: true, customer };
}
