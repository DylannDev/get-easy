import type { OptionRepository } from "@/domain/option";
import type { SelectedOptionInput } from "./types";

type Result = { ok: true } | { ok: false; error: string };

interface Args {
  optionRepository: OptionRepository;
  bookingId: string;
  agencyId: string;
  selectedOptions: SelectedOptionInput[];
}

/**
 * Détache toutes les options existantes (cas re-checkout) puis (ré)attache
 * celles sélectionnées avec un snapshot du prix/nom/type au moment de la
 * réservation — pour figer la facturation même si l'admin modifie l'option
 * plus tard. Refuse si une option est désactivée ou n'appartient pas à
 * l'agence courante (sécurité). */
export async function attachOptions({
  optionRepository,
  bookingId,
  agencyId,
  selectedOptions,
}: Args): Promise<Result> {
  await optionRepository.detachAllFromBooking(bookingId);

  for (const selected of selectedOptions) {
    const option = await optionRepository.findById(selected.optionId);
    if (!option || !option.active || option.agencyId !== agencyId) {
      return {
        ok: false,
        error: "Une des options sélectionnées n'est plus disponible.",
      };
    }
    const qty = Math.max(1, Math.min(option.maxQuantity, selected.quantity));
    await optionRepository.attachToBooking({
      bookingId,
      optionId: option.id,
      quantity: qty,
      unitPriceSnapshot: option.price,
      priceTypeSnapshot: option.priceType,
      nameSnapshot: option.name,
      monthlyCapSnapshot:
        option.capEnabled && option.priceType === "per_day"
          ? option.monthlyCap
          : null,
    });
  }

  return { ok: true };
}
