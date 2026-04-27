import { z } from "zod";

/** Schéma Zod du formulaire d'indisponibilité véhicule. La date de fin doit
 *  être >= date de début. */
export const blockedPeriodSchema = z
  .object({
    vehicleId: z.string().min(1, "Le véhicule est requis"),
    start: z.date({ error: "La date de début est requise" }),
    end: z.date({ error: "La date de fin est requise" }),
    comment: z.string(),
  })
  .refine((data) => data.end >= data.start, {
    message: "La date de fin doit être après la date de début",
    path: ["end"],
  });

export type BlockedPeriodFormValues = z.infer<typeof blockedPeriodSchema>;
