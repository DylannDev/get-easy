import { z } from "zod";

/** Schéma Zod du formulaire option (admin). */
export const optionSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(120),
  description: z.string().max(500),
  priceType: z.enum(["per_day", "flat"]),
  price: z.number().min(0, "Prix invalide"),
  maxQuantity: z.number().int().min(1).max(99),
  sortOrder: z.number().int().min(0),
  active: z.boolean(),
  capEnabled: z.boolean(),
  monthlyCap: z.number().min(0).nullable(),
});

export type OptionFormValues = z.infer<typeof optionSchema>;
