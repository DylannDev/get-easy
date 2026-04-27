"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Field } from "./field";
import type { BusinessFieldsValue, Errors, SetState } from "./types";

interface Props {
  isBusiness: boolean;
  setIsBusiness: (next: boolean) => void;
  fields: BusinessFieldsValue;
  setFields: SetState<BusinessFieldsValue>;
  errors: Errors;
}

/** Toggle "Le client est un professionnel" + bloc B2B (companyName, siret,
 *  vatNumber) révélé conditionnellement. */
export function CustomerBusinessFields({
  isBusiness,
  setIsBusiness,
  fields,
  setFields,
  errors,
}: Props) {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <Checkbox
          checked={isBusiness}
          onCheckedChange={(checked) => setIsBusiness(checked === true)}
        />
        <span className="text-sm font-medium">
          Le client est un professionnel
        </span>
      </label>
      {isBusiness && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <Field
            label="Nom de l'entreprise"
            required
            error={errors.companyName}
          >
            <Input
              value={fields.companyName}
              onChange={(e) =>
                setFields((prev) => ({ ...prev, companyName: e.target.value }))
              }
              placeholder="Acme SAS"
              className={cn("bg-white", errors.companyName && "border-red-500")}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="N° SIRET" required error={errors.siret}>
              <Input
                value={fields.siret}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, siret: e.target.value }))
                }
                placeholder="12345678900012"
                className={cn("bg-white", errors.siret && "border-red-500")}
              />
            </Field>
            <Field label="N° TVA intracommunautaire" error={errors.vatNumber}>
              <Input
                value={fields.vatNumber}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, vatNumber: e.target.value }))
                }
                placeholder="FR12345678900"
                className={cn("bg-white", errors.vatNumber && "border-red-500")}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
