"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { dbDateToFr, frDateToISO } from "@/lib/format-date-input";
import { customerStepSchema } from "@/lib/validations/customer-step";
import { getCountriesListWithPriority } from "@/lib/countries";
import { updateCustomerAction } from "@/actions/admin/customer";
import { toast } from "react-hot-toast";
import type { Customer } from "@/domain/customer";
import {
  CustomerInfoFields,
  CustomerAddressFields,
  CustomerDriverLicenseFields,
  CustomerBusinessFields,
  type CustomerFieldsValue,
  type BusinessFieldsValue,
} from "./customer-form-fields";

interface Props {
  customer: Customer;
}

export function CustomerEditForm({ customer }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [fields, setFields] = useState<CustomerFieldsValue>({
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    birthDate: dbDateToFr(customer.birthDate),
    birthPlace: customer.birthPlace ?? "",
    address: customer.address,
    address2: customer.address2 ?? "",
    postalCode: customer.postalCode,
    city: customer.city,
    country: customer.country,
    driverLicenseNumber: customer.driverLicenseNumber ?? "",
    driverLicenseIssuedAt: dbDateToFr(customer.driverLicenseIssuedAt),
    driverLicenseCountry: customer.driverLicenseCountry ?? "",
  });
  const [isBusiness, setIsBusiness] = useState(!!customer.companyName);
  const [businessFields, setBusinessFields] = useState<BusinessFieldsValue>({
    companyName: customer.companyName ?? "",
    siret: customer.siret ?? "",
    vatNumber: customer.vatNumber ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const countryOptions = useMemo(() => getCountriesListWithPriority(), []);

  const validate = (): boolean => {
    const result = customerStepSchema.safeParse({
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      phone: fields.phone,
      birthDate: fields.birthDate,
      birthPlace: fields.birthPlace || undefined,
      address: fields.address,
      address2: fields.address2 || undefined,
      postalCode: fields.postalCode,
      city: fields.city,
      country: fields.country,
      driverLicenseNumber: fields.driverLicenseNumber || undefined,
      driverLicenseIssuedAt: fields.driverLicenseIssuedAt || undefined,
      driverLicenseCountry: fields.driverLicenseCountry || undefined,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vérifiez les champs en erreur.");
      return;
    }
    setSaving(true);
    try {
      const result = await updateCustomerAction({
        customerId: customer.id,
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: fields.email,
        phone: fields.phone,
        birthDate: frDateToISO(fields.birthDate),
        birthPlace: fields.birthPlace || null,
        address: fields.address,
        address2: fields.address2 || null,
        postalCode: fields.postalCode,
        city: fields.city,
        country: fields.country,
        driverLicenseNumber: fields.driverLicenseNumber || null,
        driverLicenseIssuedAt: fields.driverLicenseIssuedAt
          ? frDateToISO(fields.driverLicenseIssuedAt)
          : null,
        driverLicenseCountry: fields.driverLicenseCountry || null,
        companyName: isBusiness
          ? businessFields.companyName.trim() || null
          : null,
        siret: isBusiness
          ? businessFields.siret.replace(/\s/g, "") || null
          : null,
        vatNumber: isBusiness
          ? businessFields.vatNumber.replace(/\s/g, "").toUpperCase() || null
          : null,
      });
      if (result.ok) {
        toast.success("Client mis à jour.");
        router.push(`/admin/clients/${customer.id}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Échec de la mise à jour.");
        setSaving(false);
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Une erreur inattendue est survenue."
      );
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saving && <ContentOverlay />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Type de client</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerBusinessFields
            isBusiness={isBusiness}
            setIsBusiness={setIsBusiness}
            fields={businessFields}
            setFields={setBusinessFields}
            errors={errors}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerInfoFields
            fields={fields}
            setFields={setFields}
            errors={errors}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adresse</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerAddressFields
            fields={fields}
            setFields={setFields}
            errors={errors}
            countryOptions={countryOptions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Permis de conduire (optionnel)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerDriverLicenseFields
            fields={fields}
            setFields={setFields}
            errors={errors}
            countryOptions={countryOptions}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => router.push(`/admin/clients/${customer.id}`)}
          disabled={saving}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          size="sm"
          className="w-full sm:w-auto"
          disabled={saving}
        >
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
