"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";

const optionPriceTypeSchema = z.enum(["per_day", "flat"]);

const createOptionSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(120),
  description: z.string().max(500).optional().nullable(),
  priceType: optionPriceTypeSchema,
  price: z.number().min(0, "Le prix doit être positif"),
  maxQuantity: z.number().int().min(1).max(99),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateOptionSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  priceType: optionPriceTypeSchema.optional(),
  price: z.number().min(0).optional(),
  maxQuantity: z.number().int().min(1).max(99).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateOptionFormInput = z.input<typeof createOptionSchema>;
export type UpdateOptionFormInput = z.input<typeof updateOptionSchema>;

export async function createOption(input: CreateOptionFormInput) {
  const parsed = createOptionSchema.parse(input);
  const agencyId = await getActiveAgency();
  if (!agencyId) {
    throw new Error("Aucune agence active. Veuillez en sélectionner une.");
  }
  const { createOptionUseCase, agencyRepository } = getContainer();
  const agency = await agencyRepository.findById(agencyId);
  if (!agency) {
    throw new Error(
      "L'agence active n'existe plus. Veuillez rafraîchir la page."
    );
  }
  await createOptionUseCase.execute({ ...parsed, agencyId });
  revalidatePath("/admin/options");
}

export async function updateOption(id: string, input: UpdateOptionFormInput) {
  const parsed = updateOptionSchema.parse(input);
  const { updateOptionUseCase } = getContainer();
  await updateOptionUseCase.execute(id, parsed);
  revalidatePath("/admin/options");
}

export async function toggleOption(id: string, active: boolean) {
  const { updateOptionUseCase } = getContainer();
  await updateOptionUseCase.execute(id, { active });
  revalidatePath("/admin/options");
}

export async function deleteOption(id: string) {
  const { deleteOptionUseCase } = getContainer();
  await deleteOptionUseCase.execute(id);
  revalidatePath("/admin/options");
}
