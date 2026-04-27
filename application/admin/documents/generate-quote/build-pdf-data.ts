import type { Agency } from "@/domain/agency";
import type { Customer } from "@/domain/customer";
import type { Vehicle } from "@/domain/vehicle";
import { getCountryName } from "@/lib/countries";
import type { QuoteItem, QuotePdfData } from "./types";

interface Args {
  quoteNumber: string;
  issuedAt: Date;
  validUntil: Date;
  agency: Agency;
  customer: Customer;
  vehicle: Vehicle;
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  pricePerDay: number;
  items: QuoteItem[];
  totalTTC: number;
  logoDataUrl: string | null;
}

/** Assemble le payload final passé au renderer PDF du devis. Identique
 *  à `buildInvoicePdfData` à 95 % — les 2 documents ont la même structure
 *  d'en-tête + lignes mais le devis ajoute `validUntil`, `rib` et
 *  `showRibOnQuote`. */
export function buildQuotePdfData(args: Args): QuotePdfData {
  const { agency, customer, vehicle } = args;
  return {
    quoteNumber: args.quoteNumber,
    issuedAt: args.issuedAt,
    validUntil: args.validUntil,
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
      rib: agency.rib ?? null,
      showRibOnQuote: agency.showRibOnQuote ?? false,
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
