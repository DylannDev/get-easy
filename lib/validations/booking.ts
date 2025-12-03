import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";
import { postcodeValidator } from "postcode-validator";
import { isValidCountryCode } from "@/lib/countries";
import { parse, isValid, differenceInYears, isFuture } from "date-fns";

// Helper pour parser les dates au format JJ/MM/AAAA
function parseFrenchDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : null;
}

// Schéma de validation pour le formulaire de réservation
export const bookingFormSchema = z
  .object({
    // Section 1 - Infos générales
    firstName: z
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .max(50, "Le prénom ne peut pas dépasser 50 caractères"),
    lastName: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(50, "Le nom ne peut pas dépasser 50 caractères"),
    email: z.string().email("Veuillez entrer une adresse email valide"),
    phone: z
      .string()
      .min(1, "Le numéro de téléphone est requis")
      .refine(
        (val) => isValidPhoneNumber(val),
        "Le numéro de téléphone n'est pas valide (format international requis)"
      ),
    birthDate: z
      .string()
      .min(1, "La date de naissance est requise")
      .refine(
        (val) => {
          const date = parseFrenchDate(val);
          return date !== null;
        },
        { message: "Format de date invalide. Utilisez JJ/MM/AAAA" }
      )
      .refine(
        (val) => {
          const date = parseFrenchDate(val);
          if (!date) return false;
          const age = differenceInYears(new Date(), date);
          return age >= 18 && age <= 120;
        },
        { message: "Vous devez avoir au moins 18 ans" }
      ),
    birthPlace: z.string().optional(),

    // Section 2 - Adresse de facturation
    address: z
      .string()
      .min(5, "L'adresse doit contenir au moins 5 caractères")
      .max(100, "L'adresse ne peut pas dépasser 100 caractères"),
    address2: z
      .string()
      .max(
        100,
        "Le complément d'adresse ne peut pas dépasser 100 caractères"
      )
      .optional(),
    postalCode: z.string().min(1, "Le code postal est requis"),
    city: z
      .string()
      .min(2, "La ville doit contenir au moins 2 caractères")
      .max(50, "La ville ne peut pas dépasser 50 caractères"),
    country: z
      .string()
      .min(2, "Le pays est requis")
      .refine(
        (val) => isValidCountryCode(val),
        "Le code pays n'est pas valide"
      ),

    // Section 3 - Infos permis de conduire
    driverLicenseNumber: z.string().optional(),
    driverLicenseIssuedAt: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          const date = parseFrenchDate(val);
          return date !== null;
        },
        { message: "Format de date invalide. Utilisez JJ/MM/AAAA" }
      )
      .refine(
        (val) => {
          if (!val) return true;
          const date = parseFrenchDate(val);
          if (!date) return false;
          return !isFuture(date);
        },
        { message: "La date d'obtention ne peut pas être dans le futur" }
      ),
    driverLicenseCountry: z.string().optional(),
  })
  .refine(
    (data) => {
      // Valider le code postal en fonction du pays sélectionné
      if (!data.postalCode || !data.country) return true;
      return postcodeValidator(data.postalCode, data.country);
    },
    {
      message: "Le code postal n'est pas valide pour le pays sélectionné",
      path: ["postalCode"],
    }
  );

export type BookingFormData = z.infer<typeof bookingFormSchema>;
