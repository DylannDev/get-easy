"use client";

import Link from "next/link";
import {
  Controller,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import type { BookingFormData } from "@/lib/validations/booking";

interface Props {
  control: Control<BookingFormData>;
  errors: FieldErrors<BookingFormData>;
  agencyId: string;
  agencyName: string;
}

/** Case à cocher d'acceptation des CGL avec lien vers la page dédiée
 *  (les CGL dépendent de l'agence — d'où le `?agency={id}`). */
export function TermsCheckbox({ control, errors, agencyId, agencyName }: Props) {
  return (
    <div className="bg-green/40 p-2 rounded-md mb-0">
      <div className="flex items-start gap-3">
        <Controller
          name="acceptTerms"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="acceptTerms"
              checked={field.value}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
              aria-invalid={!!errors.acceptTerms}
              className="mt-0.5"
            />
          )}
        />
        <div className="flex-1">
          <label htmlFor="acceptTerms" className="text-sm cursor-pointer">
            J&apos;accepte les{" "}
            <Link
              href={`/conditions-generales-de-location?agency=${agencyId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black font-bold hover:underline"
            >
              Conditions Générales de Location
            </Link>{" "}
            et que <strong>{agencyName}</strong> traite mes informations.{" "}
            <span className="text-red-500">*</span>
          </label>
          {errors.acceptTerms && (
            <p className="text-sm text-red-600 mt-1">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
