"use client";

import { useState } from "react";
import { dbDateToFr } from "@/lib/format-date-input";
import {
  customerStepSchema,
  customerStepQuoteSchema,
} from "@/lib/validations/customer-step";
import type { StagedDocState } from "@/components/booking/customer-documents-upload";
import type {
  CustomerFieldsValue,
  BusinessFieldsValue,
} from "@/components/admin/clients/customer-form-fields";

interface InitialCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthPlace?: string | null;
  address: string;
  address2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  driverLicenseNumber?: string | null;
  driverLicenseIssuedAt?: string | null;
  driverLicenseCountry?: string | null;
  companyName?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
}

const EMPTY_CUSTOMER: CustomerFieldsValue = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  birthPlace: "",
  address: "",
  address2: "",
  postalCode: "",
  city: "",
  country: "FR",
  driverLicenseNumber: "",
  driverLicenseIssuedAt: "",
  driverLicenseCountry: "",
};

function fromInitial(initial: InitialCustomer): CustomerFieldsValue {
  return {
    firstName: initial.firstName,
    lastName: initial.lastName,
    email: initial.email,
    phone: initial.phone,
    birthDate: dbDateToFr(initial.birthDate),
    birthPlace: initial.birthPlace ?? "",
    address: initial.address,
    address2: initial.address2 ?? "",
    postalCode: initial.postalCode,
    city: initial.city,
    country: initial.country,
    driverLicenseNumber: initial.driverLicenseNumber ?? "",
    driverLicenseIssuedAt: dbDateToFr(initial.driverLicenseIssuedAt),
    driverLicenseCountry: initial.driverLicenseCountry ?? "",
  };
}

/**
 * Encapsule l'état du formulaire client de l'étape 3 du wizard (champs
 * principaux + B2B + erreurs + pièces jointes en staging) ainsi que la
 * validation Zod. En mode "quote", seuls le prénom et le nom sont
 * obligatoires (un devis peut partir avec un client à peine renseigné),
 * et le schéma "lite" est utilisé pour la validation. */
export function useWizardCustomerForm(
  initial?: InitialCustomer,
  options: { mode?: "booking" | "quote" } = {},
) {
  const isQuote = options.mode === "quote";
  const [customer, setCustomer] = useState<CustomerFieldsValue>(
    initial ? fromInitial(initial) : EMPTY_CUSTOMER,
  );
  const [isBusiness, setIsBusiness] = useState(!!initial?.companyName);
  const [businessFields, setBusinessFields] = useState<BusinessFieldsValue>({
    companyName: initial?.companyName ?? "",
    siret: initial?.siret ?? "",
    vatNumber: initial?.vatNumber ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [stagedDocs, setStagedDocs] = useState<StagedDocState>({});

  const requiredFieldsFilled = isQuote
    ? !!(customer.firstName && customer.lastName)
    : !!(
        customer.firstName &&
        customer.lastName &&
        customer.email &&
        customer.phone &&
        customer.birthDate &&
        customer.address &&
        customer.postalCode &&
        customer.city
      );

  /** Valide via le schéma adapté au mode (booking = strict, quote = lite).
   *  Pose les erreurs par champ et renvoie `true` si tout est OK. */
  const validate = (): boolean => {
    const schema = isQuote ? customerStepQuoteSchema : customerStepSchema;
    const result = schema.safeParse({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      birthDate: customer.birthDate,
      birthPlace: customer.birthPlace || undefined,
      address: customer.address,
      address2: customer.address2 || undefined,
      postalCode: customer.postalCode,
      city: customer.city,
      country: customer.country,
      driverLicenseNumber: customer.driverLicenseNumber || undefined,
      driverLicenseIssuedAt: customer.driverLicenseIssuedAt || undefined,
      driverLicenseCountry: customer.driverLicenseCountry || undefined,
      isBusiness,
      companyName: businessFields.companyName,
      siret: businessFields.siret,
      vatNumber: businessFields.vatNumber,
    });
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    setErrors(fieldErrors);
    return false;
  };

  return {
    customer,
    setCustomer,
    isBusiness,
    setIsBusiness,
    businessFields,
    setBusinessFields,
    errors,
    stagedDocs,
    setStagedDocs,
    requiredFieldsFilled,
    validate,
  };
}
