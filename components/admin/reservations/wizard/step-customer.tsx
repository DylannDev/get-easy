"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  CustomerInfoFields,
  CustomerAddressFields,
  CustomerDriverLicenseFields,
  CustomerBusinessFields,
  Field,
  type CustomerFieldsValue,
  type BusinessFieldsValue,
} from "@/components/admin/clients/customer-form-fields";
import {
  CustomerDocumentsUpload,
  type StagedDocState,
} from "@/components/booking/customer-documents-upload";
import { dbDateToFr } from "@/lib/format-date-input";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";
import type { CustomerPickerOption } from "../new-booking-wizard";

interface Props {
  existingCustomers?: CustomerPickerOption[];
  isEdit: boolean;
  /** En mode devis : pas de section permis de conduire ni de pièces jointes,
   *  et seuls le prénom et le nom sont marqués comme obligatoires. */
  isQuote?: boolean;

  customer: CustomerFieldsValue;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerFieldsValue>>;

  isBusiness: boolean;
  setIsBusiness: (next: boolean) => void;
  businessFields: BusinessFieldsValue;
  setBusinessFields: React.Dispatch<React.SetStateAction<BusinessFieldsValue>>;

  customerErrors: Record<string, string | undefined>;
  countryOptions: { value: string; label: string }[];

  stagedDocs: StagedDocState;
  setStagedDocs: React.Dispatch<React.SetStateAction<StagedDocState>>;

  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function StepCustomer({
  existingCustomers,
  isEdit,
  isQuote = false,
  customer,
  setCustomer,
  isBusiness,
  setIsBusiness,
  businessFields,
  setBusinessFields,
  customerErrors,
  countryOptions,
  stagedDocs,
  setStagedDocs,
  canGoNext,
  onPrev,
  onNext,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informations client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingCustomers && existingCustomers.length > 0 && !isEdit && (
          <Field label="Client existant (optionnel)">
            <NativeSelect
              value=""
              onValueChange={(id) => {
                if (!id) return;
                const c = existingCustomers.find((x) => x.id === id);
                if (!c) return;
                // Auto-remplit tous les champs à partir du client choisi.
                // L'utilisateur peut ajuster avant de valider — le backend
                // fera un upsert par email.
                setCustomer({
                  firstName: c.firstName,
                  lastName: c.lastName,
                  email: c.email,
                  phone: c.phone,
                  birthDate: dbDateToFr(c.birthDate),
                  birthPlace: c.birthPlace ?? "",
                  address: c.address,
                  address2: c.address2 ?? "",
                  postalCode: c.postalCode,
                  city: c.city,
                  country: c.country,
                  driverLicenseNumber: c.driverLicenseNumber ?? "",
                  driverLicenseIssuedAt: dbDateToFr(c.driverLicenseIssuedAt),
                  driverLicenseCountry: c.driverLicenseCountry ?? "",
                });
                if (c.companyName) {
                  setIsBusiness(true);
                  setBusinessFields({
                    companyName: c.companyName ?? "",
                    siret: c.siret ?? "",
                    vatNumber: c.vatNumber ?? "",
                  });
                } else {
                  setIsBusiness(false);
                  setBusinessFields({
                    companyName: "",
                    siret: "",
                    vatNumber: "",
                  });
                }
              }}
              placeholder="— Sélectionner pour pré-remplir —"
              options={existingCustomers.map((c) => ({
                value: c.id,
                label: `${c.firstName} ${c.lastName} · ${c.email}`,
              }))}
            />
          </Field>
        )}
        <CustomerBusinessFields
          isBusiness={isBusiness}
          setIsBusiness={setIsBusiness}
          fields={businessFields}
          setFields={setBusinessFields}
          errors={customerErrors}
        />
        <CustomerInfoFields
          fields={customer}
          setFields={setCustomer}
          errors={customerErrors}
          showPlaceholders
          liteMode={isQuote}
        />
        <CustomerAddressFields
          fields={customer}
          setFields={setCustomer}
          errors={customerErrors}
          countryOptions={countryOptions}
          showPlaceholders
          liteMode={isQuote}
        />

        {!isQuote && (
          <>
            <div className="pt-2">
              <h4 className="text-sm font-semibold tracking-wide mb-3">
                Permis de conduire (facultatif)
              </h4>
              <CustomerDriverLicenseFields
                fields={customer}
                setFields={setCustomer}
                errors={customerErrors}
                countryOptions={countryOptions}
              />
            </div>

            {/* Pièces jointes — même composant que le site public */}
            <CustomerDocumentsUpload
              value={stagedDocs}
              onChange={setStagedDocs}
            />
          </>
        )}

        <div className="flex justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onPrev}>
            <PiCaretLeft className="size-4" />
            Précédent
          </Button>
          <Button type="button" size="sm" disabled={!canGoNext} onClick={onNext}>
            Suivant
            <PiCaretRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
