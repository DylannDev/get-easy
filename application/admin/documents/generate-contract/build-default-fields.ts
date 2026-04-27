import type { ContractEditableFields } from "@/domain/contract";
import { getCountryName } from "@/lib/countries";
import { formatEurMoney, formatLongDateTime } from "./format";

interface Args {
  customer: {
    firstName: string;
    lastName: string;
    birthDate: string;
    birthPlace?: string | null;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    driverLicenseNumber?: string | null;
    driverLicenseIssuedAt?: string | null;
  };
  vehicle: {
    brand: string;
    model: string;
    color: string;
    registrationPlate: string;
    fiscalPower?: number | null;
  };
  agency: { city: string };
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  pricePerDay: number;
  totalPrice: number;
}

/**
 * Construit la source "défaut" utilisée quand aucune valeur éditée n'est
 * encore stockée — à partir de la réservation / client / véhicule actuels.
 * Les valeurs sauvegardées par l'admin l'emportent sur ces défauts au
 * moment du merge dans le use-case principal.
 */
export function buildDefaultContractFields(
  args: Args,
): ContractEditableFields {
  const { customer, vehicle, agency } = args;
  return {
    customerFirstName: customer.firstName,
    customerLastName: customer.lastName,
    customerBirthDate: customer.birthDate,
    customerBirthPlace: customer.birthPlace ?? "",
    customerLicenseNumber: customer.driverLicenseNumber ?? "",
    customerLicenseIssuedAt: customer.driverLicenseIssuedAt ?? "",
    customerAddress: customer.address,
    customerPostalCode: customer.postalCode,
    customerCity: customer.city,
    customerCountry: getCountryName(customer.country) ?? customer.country,
    customerPhone: customer.phone,
    customerEmail: customer.email,

    vehicleBrand: vehicle.brand,
    vehicleModel: vehicle.model,
    vehicleColor: vehicle.color,
    vehicleRegistrationPlate: vehicle.registrationPlate,
    vehicleFiscalPower:
      vehicle.fiscalPower !== null && vehicle.fiscalPower !== undefined
        ? String(vehicle.fiscalPower)
        : "",

    durationLabel: `${args.numberOfDays} jour${args.numberOfDays > 1 ? "s" : ""}`,
    rentalStart: formatLongDateTime(args.startDate),
    rentalEnd: formatLongDateTime(args.endDate),
    pricePerDay: formatEurMoney(args.pricePerDay),
    priceTotal: formatEurMoney(args.totalPrice),

    returnDatetime: formatLongDateTime(args.endDate),
    contractCity: agency.city,
    contractDate: new Date().toLocaleDateString("fr-FR"),
  };
}
