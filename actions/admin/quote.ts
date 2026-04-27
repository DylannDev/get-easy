"use server";

import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";
import { getContainer } from "@/composition-root/container";
import type { CustomerDocumentType } from "@/domain/customer-document";

interface StagedDocumentInput {
  stagingKey: string;
  type: CustomerDocumentType;
  fileName: string;
  mimeType: string;
  size: number;
}

interface ManualQuoteInput {
  vehicleId: string;
  agencyId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    birthPlace?: string | null;
    address: string;
    address2?: string | null;
    postalCode: string;
    city: string;
    country: string;
    driverLicenseNumber?: string | null;
    driverLicenseIssuedAt?: string | null;
    driverLicenseCountry?: string | null;
    companyName?: string | null;
    siret?: string | null;
    vatNumber?: string | null;
  };
  selectedOptions?: { optionId: string; quantity: number }[];
  stagedDocuments?: StagedDocumentInput[];
}

export interface CreateQuoteResult {
  ok: boolean;
  error?: string;
  /** ID du document `quote` créé — à utiliser pour obtenir l'URL signée de téléchargement. */
  documentId?: string;
  /** Numéro DEV-YYYY-NNN attribué. */
  quoteNumber?: string;
}

/**
 * Crée un devis à partir du wizard admin :
 *   1. Trouve/crée le client (par email)
 *   2. Insère la ligne `quotes` + les `quote_options` (snapshots)
 *   3. Appelle `generateQuoteUseCase` → numérotation + PDF + `documents`
 *   4. Renvoie l'ID du document pour que le client déclenche le
 *      téléchargement via une URL signée.
 *
 * Pas de redirect serveur — l'UI reste sur le wizard et récupère le
 * PDF via un appel léger avant de revenir à la liste.
 */
export async function createQuote(
  input: ManualQuoteInput
): Promise<CreateQuoteResult> {
  const {
    customerRepository,
    optionRepository,
    agencyRepository,
    quoteRepository,
    generateQuoteUseCase,
    customerDocumentRepository,
  } = getContainer();

  const agency = await agencyRepository.findById(input.agencyId);
  if (!agency) return { ok: false, error: "Agence introuvable." };

  // 1. Find or create customer (même règle que createManualBooking).
  let customer = await customerRepository.findByEmail(input.customer.email);
  if (!customer) {
    customer = await customerRepository.create({ ...input.customer });
  } else if (input.customer.companyName) {
    const updated = await customerRepository.update(customer.id, {
      companyName: input.customer.companyName,
      siret: input.customer.siret ?? null,
      vatNumber: input.customer.vatNumber ?? null,
    });
    if (updated) customer = updated;
  }

  // 2. Calcule la date de validité (par défaut 30 jours, paramétrable
  // par agence). Utilise la date du jour comme point de départ.
  const validityDays = agency.quoteValidityDays ?? 30;
  const validUntilDate = addDays(new Date(), validityDays);
  const validUntil = format(validUntilDate, "yyyy-MM-dd");

  // 3. Calcule la part options (snapshots) pour remplir `options_total`
  // et déduire `base_price` du total fourni par le client.
  const selectedOptions = input.selectedOptions ?? [];
  let optionsTotal = 0;
  const attachInputs: Array<{
    optionId: string;
    quantity: number;
    unitPriceSnapshot: number;
    priceTypeSnapshot: "per_day" | "flat";
    nameSnapshot: string;
    monthlyCapSnapshot: number | null;
  }> = [];

  // On calcule la durée en jours pour reconstituer les totaux d'options
  // (forfait = fixe, per_day = multiplier × jours, borné par plafond).
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const numberOfDays = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  for (const sel of selectedOptions) {
    const option = await optionRepository.findById(sel.optionId);
    if (!option || !option.active || option.agencyId !== input.agencyId) continue;
    const qty = Math.max(1, Math.min(option.maxQuantity, sel.quantity));

    // Snapshot de la ligne — reprend la même formule que pour une résa :
    // priceType flat → prix × qty ; per_day → prix × qty × days (borné).
    const monthlyCap =
      option.capEnabled && option.priceType === "per_day"
        ? option.monthlyCap
        : null;
    let lineTotal: number;
    if (option.priceType === "flat") {
      lineTotal = option.price * qty;
    } else {
      const daily = option.price * qty * numberOfDays;
      if (monthlyCap != null) {
        // Plafond appliqué par tranche de 30 jours entamée (cf. Phase 7A).
        const DAYS_PER_MONTH = 30;
        const completeMonths = Math.floor(numberOfDays / DAYS_PER_MONTH);
        const remainderDays = numberOfDays - completeMonths * DAYS_PER_MONTH;
        const fullMonthCost = Math.min(
          DAYS_PER_MONTH * option.price,
          monthlyCap
        );
        const remainderCost = Math.min(
          remainderDays * option.price,
          monthlyCap
        );
        lineTotal = (completeMonths * fullMonthCost + remainderCost) * qty;
      } else {
        lineTotal = daily;
      }
    }
    optionsTotal += lineTotal;

    attachInputs.push({
      optionId: option.id,
      quantity: qty,
      unitPriceSnapshot: option.price,
      priceTypeSnapshot: option.priceType,
      nameSnapshot: option.name,
      monthlyCapSnapshot: monthlyCap,
    });
  }

  const basePrice = Math.max(0, input.totalPrice - optionsTotal);

  // 4. Persistence : quote + options.
  const quote = await quoteRepository.create({
    agencyId: input.agencyId,
    customerId: customer.id,
    vehicleId: input.vehicleId,
    startDate: input.startDate,
    endDate: input.endDate,
    basePrice,
    optionsTotal,
    cglTotal: 0, // Pas encore géré côté wizard admin, à étendre si besoin.
    totalPrice: input.totalPrice,
    validUntil,
  });

  for (const attach of attachInputs) {
    await quoteRepository.attachOption({
      quoteId: quote.id,
      ...attach,
    });
  }

  // 5. Génération du PDF + ligne `documents`.
  const outcome = await generateQuoteUseCase.execute(quote.id);
  if (outcome.kind === "error") {
    return { ok: false, error: outcome.message };
  }

  // 6. Finalise les pièces jointes en staging — pas de booking pour un devis,
  // donc on les lie uniquement au customer (booking_id = null).
  if (input.stagedDocuments && input.stagedDocuments.length > 0) {
    if (agency.organizationId) {
      await Promise.all(
        input.stagedDocuments.map(async (doc) => {
          try {
            await customerDocumentRepository.finalizeFromStaging({
              stagingKey: doc.stagingKey,
              customerId: customer.id,
              bookingId: null,
              type: doc.type,
              organizationId: agency.organizationId!,
              fileName: doc.fileName,
              mimeType: doc.mimeType,
              size: doc.size,
            });
          } catch (e) {
            console.error(
              `[quote] Failed to finalize customer document (${doc.type}):`,
              e
            );
          }
        })
      );
    }
  }

  revalidatePath("/admin/documents");
  revalidatePath("/admin/clients");

  return {
    ok: true,
    documentId: outcome.document.id,
    quoteNumber: outcome.document.quoteNumber ?? undefined,
  };
}
