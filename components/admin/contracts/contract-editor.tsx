"use client";

import { Button } from "@/components/ui/button";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import type { ContractEditableFields } from "@/domain/contract";
import { useContractForm } from "./editor/use-contract-form";
import {
  AgencyReadOnlyCard,
  type AgencyReadOnly,
} from "./editor/agency-readonly-card";
import { ContractFieldsCard } from "./editor/fields-card";
import { SignaturesCard } from "./editor/signatures-card";
import {
  CUSTOMER_FIELDS,
  VEHICLE_FIELDS,
  DURATION_FIELDS,
  MISC_FIELDS,
} from "./editor/contract-field-defs";

interface Props {
  bookingId: string;
  agency: AgencyReadOnly;
  initialFields: ContractEditableFields;
  initialSignatures: {
    customer: string | null;
    loueur: string | null;
  };
  signedAt: string | null;
}

/**
 * Container de l'éditeur de contrat de location : compose 6 cards
 * (Loueur readonly + Locataire/Véhicule/Durée/Divers data-driven +
 * Signatures) et l'action bar. La logique de submit/transition est
 * dans `useContractForm`. */
export function ContractEditor({
  bookingId,
  agency,
  initialFields,
  initialSignatures,
  signedAt,
}: Props) {
  const loueurSignature = initialSignatures.loueur;
  const {
    pending,
    fields,
    update,
    setCustomerSignature,
    error,
    savedAt,
    submit,
  } = useContractForm({
    bookingId,
    initialFields,
    initialCustomerSignature: initialSignatures.customer,
    loueurSignature,
  });

  return (
    <>
      {pending && <ContentOverlay />}
      <form onSubmit={submit} className="space-y-6">
        <AgencyReadOnlyCard agency={agency} />
        <ContractFieldsCard
          title="Locataire"
          fields={fields}
          groups={CUSTOMER_FIELDS}
          onUpdate={update}
        />
        <ContractFieldsCard
          title="Véhicule"
          fields={fields}
          groups={VEHICLE_FIELDS}
          onUpdate={update}
        />
        <ContractFieldsCard
          title="Durée et montants"
          fields={fields}
          groups={DURATION_FIELDS}
          onUpdate={update}
        />
        <ContractFieldsCard
          title="Divers"
          fields={fields}
          groups={MISC_FIELDS}
          onUpdate={update}
        />
        <SignaturesCard
          initialCustomerSignature={initialSignatures.customer}
          loueurSignature={loueurSignature}
          onCustomerChange={setCustomerSignature}
          signedAt={signedAt}
        />

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="text-xs text-muted-foreground">
            {error ? (
              <span className="text-red-500">{error}</span>
            ) : savedAt ? (
              <span className="text-green-600">
                Enregistré à {savedAt.toLocaleTimeString("fr-FR")}
              </span>
            ) : null}
          </div>
          <Button
            type="submit"
            size="sm"
            className="w-full sm:w-auto"
            disabled={pending}
          >
            {pending ? "Enregistrement…" : "Enregistrer et générer le PDF"}
          </Button>
        </div>
      </form>
    </>
  );
}
