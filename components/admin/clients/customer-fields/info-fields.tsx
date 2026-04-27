"use client";

import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import {
  handleDateInputChange,
  handleDateKeyDown,
} from "@/lib/format-date-input";
import { Field } from "./field";
import type { CustomerFieldsValue, Errors, SetState } from "./types";

interface Props {
  fields: CustomerFieldsValue;
  setFields: SetState<CustomerFieldsValue>;
  errors: Errors;
  showPlaceholders?: boolean;
  /** En mode "lite" (devis) : seuls prénom/nom restent marqués obligatoires
   *  visuellement, les autres champs deviennent optionnels. */
  liteMode?: boolean;
}

/** Champs principaux du client : identité + contact + naissance. */
export function CustomerInfoFields({
  fields,
  setFields,
  errors,
  showPlaceholders = false,
  liteMode = false,
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Prénom" required error={errors.firstName}>
          <Input
            name="firstName"
            value={fields.firstName}
            onChange={handleChange}
            placeholder={showPlaceholders ? "Jean" : undefined}
            className={cn(errors.firstName && "border-red-500")}
          />
        </Field>
        <Field label="Nom" required error={errors.lastName}>
          <Input
            name="lastName"
            value={fields.lastName}
            onChange={handleChange}
            placeholder={showPlaceholders ? "Dupont" : undefined}
            className={cn(errors.lastName && "border-red-500")}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" required={!liteMode} error={errors.email}>
          <Input
            name="email"
            type="email"
            value={fields.email}
            onChange={handleChange}
            placeholder={showPlaceholders ? "jean@exemple.com" : undefined}
            className={cn(errors.email && "border-red-500")}
          />
        </Field>
        <Field label="Téléphone" required={!liteMode} error={errors.phone}>
          <PhoneInput
            value={fields.phone}
            onChange={(value) =>
              setFields((prev) => ({ ...prev, phone: value ?? "" }))
            }
            placeholder={
              showPlaceholders ? "Entrez votre numéro de téléphone" : undefined
            }
            className={cn(errors.phone && "border-red-500", "phone-input")}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Date de naissance"
          required={!liteMode}
          error={errors.birthDate}
        >
          <Input
            name="birthDate"
            value={fields.birthDate}
            placeholder="JJ/MM/AAAA"
            maxLength={10}
            onChange={(e) =>
              handleDateInputChange(e, (val) =>
                setFields((prev) => ({ ...prev, birthDate: val })),
              )
            }
            onKeyDown={(e) =>
              handleDateKeyDown(e, (val) =>
                setFields((prev) => ({ ...prev, birthDate: val })),
              )
            }
            className={cn(errors.birthDate && "border-red-500")}
          />
        </Field>
        <Field label="Lieu de naissance" error={errors.birthPlace}>
          <Input
            name="birthPlace"
            value={fields.birthPlace}
            onChange={handleChange}
            placeholder={showPlaceholders ? "Cayenne" : undefined}
          />
        </Field>
      </div>
    </div>
  );
}
