import { format, parse } from "date-fns";
import type { CreateCustomerInput } from "@/domain/customer";
import type { CheckoutCustomerData } from "./types";

/** Convertit une date française "JJ/MM/AAAA" vers le format SQL
 *  "YYYY-MM-DD". Renvoie `null` si l'entrée est vide ou invalide. */
export function frenchDateToISODate(
  value: string | undefined | null,
): string | null {
  if (!value) return null;
  try {
    const parsed = parse(value, "dd/MM/yyyy", new Date());
    return format(parsed, "yyyy-MM-dd");
  } catch {
    return null;
  }
}

/** Construit le payload `CreateCustomerInput` à partir des données du
 *  formulaire public. Les champs pro (B2B) ne sont remplis que si la case
 *  "Je suis un professionnel" est cochée. SIRET et TVA sont nettoyés des
 *  espaces et la TVA upper-case avant stockage. */
export function toCreateCustomerInput(
  data: CheckoutCustomerData,
): CreateCustomerInput {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    birthDate: frenchDateToISODate(data.birthDate) ?? "",
    birthPlace: data.birthPlace ?? null,
    address: data.address,
    address2: data.address2 ?? null,
    postalCode: data.postalCode,
    city: data.city,
    country: data.country,
    driverLicenseNumber: data.driverLicenseNumber ?? null,
    driverLicenseIssuedAt: frenchDateToISODate(data.driverLicenseIssuedAt),
    driverLicenseCountry: data.driverLicenseCountry ?? null,
    companyName: data.isBusiness ? data.companyName?.trim() || null : null,
    siret: data.isBusiness ? data.siret?.replace(/\s/g, "") || null : null,
    vatNumber: data.isBusiness
      ? data.vatNumber?.replace(/\s/g, "").toUpperCase() || null
      : null,
  };
}

/** Patch B2B à appliquer à un client existant qui (re)coche "Je suis un
 *  professionnel" — n'écrase aucune autre information. */
export function buildB2BPatch(data: CheckoutCustomerData) {
  return {
    companyName: data.companyName?.trim() || null,
    siret: data.siret?.replace(/\s/g, "") || null,
    vatNumber: data.vatNumber?.replace(/\s/g, "").toUpperCase() || null,
  };
}
