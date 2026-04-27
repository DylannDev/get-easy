import type { Agency } from "@/domain/agency";
import type { Customer } from "@/domain/customer";
import type { Vehicle } from "@/domain/vehicle";
import { getCountryName } from "@/lib/countries";
import type { InvoiceItem, InvoicePdfData } from "./types";

interface Args {
  invoiceNumber: string;
  issuedAt: Date;
  agency: Agency;
  customer: Customer;
  vehicle: Vehicle;
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  pricePerDay: number;
  items: InvoiceItem[];
  totalTTC: number;
  logoDataUrl: string | null;
}

/** Assemble le payload final passé au renderer PDF. Le code pays client
 *  est résolu en nom long (avec fallback sur le code), les drapeaux TVA
 *  côté agence sont propagés tels quels au template. */
export function buildInvoicePdfData(args: Args): InvoicePdfData {
  const { agency, customer, vehicle } = args;
  return {
    invoiceNumber: args.invoiceNumber,
    issuedAt: args.issuedAt,
    agency: {
      name: agency.name,
      address: agency.address,
      city: agency.city,
      postalCode: agency.postalCode ?? null,
      country: agency.country
        ? (getCountryName(agency.country) ?? agency.country)
        : null,
      phone: agency.phone ?? null,
      email: agency.email ?? null,
      legalForm: agency.legalForm ?? null,
      capitalSocial: agency.capitalSocial ?? null,
      rcsCity: agency.rcsCity ?? null,
      rcsNumber: agency.rcsNumber ?? null,
      siret: agency.siret ?? null,
      tvaIntracom: agency.tvaIntracom ?? null,
      logoUrl: args.logoDataUrl,
      vatEnabled: agency.vatEnabled ?? false,
    },
    customer: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      postalCode: customer.postalCode,
      city: customer.city,
      country: getCountryName(customer.country) ?? customer.country,
      companyName: customer.companyName,
      siret: customer.siret,
      vatNumber: customer.vatNumber,
    },
    vehicle: {
      brand: vehicle.brand,
      model: vehicle.model,
      registrationPlate: vehicle.registrationPlate,
    },
    startDate: args.startDate,
    endDate: args.endDate,
    numberOfDays: args.numberOfDays,
    pricePerDay: args.pricePerDay,
    items: args.items,
    totalTTC: args.totalTTC,
  };
}
