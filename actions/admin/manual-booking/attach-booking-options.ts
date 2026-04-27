import type { OptionRepository } from "@/domain/option";
import type { SelectedOptionInput } from "./types";

interface Args {
  optionRepository: OptionRepository;
  bookingId: string;
  agencyId: string;
  selectedOptions: SelectedOptionInput[];
  /** Si `true` (mode update), détache toutes les options existantes avant
   *  réattachement. En création le booking n'a aucune option attachée — on
   *  saute le detach pour économiser une requête. */
  detachFirst: boolean;
}

/** Attache les options sélectionnées à la réservation avec snapshots du
 *  prix/nom/type. Les options invalides (désactivées, autre agence ou
 *  introuvables) sont silencieusement ignorées. La quantité est bornée à
 *  `[1, option.maxQuantity]`. */
export async function attachBookingOptions({
  optionRepository,
  bookingId,
  agencyId,
  selectedOptions,
  detachFirst,
}: Args): Promise<void> {
  if (detachFirst) {
    await optionRepository.detachAllFromBooking(bookingId);
  }

  for (const selected of selectedOptions) {
    const option = await optionRepository.findById(selected.optionId);
    if (!option || !option.active || option.agencyId !== agencyId) {
      continue;
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
}
