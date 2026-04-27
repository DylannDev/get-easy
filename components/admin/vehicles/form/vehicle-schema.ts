import { z } from "zod";

/** Schéma Zod du formulaire véhicule (admin). Partagé entre `useForm` et
 *  les types des sous-composants pour rester cohérent. */
export const vehicleSchema = z.object({
  agencyId: z.string().min(1, "L'agence est requise"),
  brand: z.string().min(1, "La marque est requise"),
  model: z.string().min(1, "Le modèle est requis"),
  color: z.string().min(1, "La couleur est requise"),
  pricePerDay: z.coerce.number().min(1, "Le prix est requis"),
  transmission: z.enum(["manuelle", "automatique"]),
  fuelType: z.enum(["essence", "diesel", "électrique", "hybride"]),
  numberOfSeats: z.coerce.number().min(1, "Min. 1 place"),
  numberOfDoors: z.coerce.number().min(1, "Min. 1 porte"),
  trunkSize: z.string().min(1, "La taille du coffre est requise"),
  year: z.coerce
    .number()
    .min(2000, "Année invalide")
    .max(2035, "Année invalide"),
  registrationPlate: z.string().min(1, "L'immatriculation est requise"),
  quantity: z.coerce.number().min(1, "Min. 1"),
  img: z.string().min(1, "L'image est requise"),
  fiscalPower: z.coerce.number().min(0).max(99).optional(),
});

/** Type "output" du schéma — valeurs après coercion (pricePerDay: number).
 *  Utilisé après `handleSubmit` pour la soumission. */
export type VehicleFormValues = z.infer<typeof vehicleSchema>;

/** Type "input" du schéma — valeurs telles qu'inférées par `useForm` sans
 *  generic (pricePerDay: unknown car `z.coerce.number()`). C'est ce type
 *  que les sous-composants reçoivent via `register`/`errors`/`control`. */
export type VehicleFormInput = z.input<typeof vehicleSchema>;
