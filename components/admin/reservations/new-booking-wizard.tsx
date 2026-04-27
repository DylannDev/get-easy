"use client";

import { useMemo, useState } from "react";
import { frDateToISO } from "@/lib/format-date-input";
import { getCountriesListWithPriority } from "@/lib/countries";
import { stagedDocsToPayload } from "@/components/booking/customer-documents-upload";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { generateTimeSlots } from "@/lib/utils";
import { quotePrice, isVehicleAvailable } from "@/domain/vehicle";
import { computeOptionsTotal } from "@/domain/option";
import type { BookingAvailabilityView } from "@/domain/vehicle";
import {
  createManualBooking,
  updateManualBooking,
} from "@/actions/admin/manual-booking";
import { createQuote } from "@/actions/admin/quote";
import { getDocumentInlineUrl } from "@/actions/admin/documents";
import { useRouter, useSearchParams } from "next/navigation";
import type { Vehicle } from "@/domain/vehicle";
import type { Agency } from "@/domain/agency";
import type { Option } from "@/domain/option";
import type { Customer } from "@/domain/customer";
import { WizardSteps } from "./wizard/wizard-steps";
import { StepDatesVehicle } from "./wizard/step-dates-vehicle";
import { StepOptions } from "./wizard/step-options";
import { StepCustomer } from "./wizard/step-customer";
import { StepRecap } from "./wizard/step-recap";
import { useWizardCustomerForm } from "./wizard/use-wizard-customer-form";

/** Forme minimale d'un client existant, pour la sélection dans le wizard. */
export type CustomerPickerOption = Pick<
  Customer,
  | "id"
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "birthDate"
  | "birthPlace"
  | "address"
  | "address2"
  | "postalCode"
  | "city"
  | "country"
  | "driverLicenseNumber"
  | "driverLicenseIssuedAt"
  | "driverLicenseCountry"
  | "companyName"
  | "siret"
  | "vatNumber"
>;

/** Mode d'utilisation du wizard — réservation payée, ou simple devis PDF. */
export type WizardMode = "booking" | "quote";

export interface InitialBookingData {
  bookingId: string;
  startDate: Date;
  endDate: Date;
  vehicleId: string;
  agencyId: string;
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
  selectedOptions: Record<string, number>;
}

interface Props {
  vehicles: Vehicle[];
  agencies: Agency[];
  optionsByAgency: Record<string, Option[]>;
  /**
   * Résas actives par véhicule — utilisé pour n'afficher à l'étape 1
   * que les véhicules disponibles sur les dates choisies (même logique
   * que le site public). Chargé côté serveur en une passe batch via
   * `bookingRepository.findActiveAvailabilityViewsByVehicleIds(...)`.
   */
  bookingsByVehicle?: Record<string, BookingAvailabilityView[]>;
  /**
   * Clients existants proposés dans un select à l'étape 3 pour
   * auto-remplir le formulaire. Optionnel — si non fourni, seule la
   * saisie manuelle est proposée.
   */
  existingCustomers?: CustomerPickerOption[];
  /**
   * Si fourni : mode édition. Tous les champs sont pré-remplis et
   * l'agence devient verrouillée. `handleSubmit` appelle
   * `updateManualBooking`.
   */
  initialBooking?: InitialBookingData;
  /**
   * Mode d'utilisation du wizard. Défaut : "booking" (création de
   * réservation). "quote" enchaîne les mêmes 4 étapes mais produit
   * un PDF de devis téléchargeable au lieu de créer une réservation.
   */
  mode?: WizardMode;
}

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1, label: "Dates et véhicule" },
  { num: 2, label: "Options" },
  { num: 3, label: "Client" },
  { num: 4, label: "Récapitulatif" },
];

export function NewBookingWizard({
  vehicles,
  agencies,
  optionsByAgency,
  bookingsByVehicle,
  existingCustomers,
  initialBooking,
  mode = "booking",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `?from=documents` quand le wizard a été ouvert depuis /admin/documents :
  // on retourne sur cet écran (onglet Devis) après génération.
  const fromDocuments = searchParams.get("from") === "documents";
  const isEdit = !!initialBooking;
  const isQuote = mode === "quote";
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialBooking?.startDate,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialBooking?.endDate,
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    initialBooking?.vehicleId ?? "",
  );
  const [agencyId, setAgencyId] = useState(
    initialBooking?.agencyId ?? agencies[0]?.id ?? "",
  );

  // Heures de départ et retour — extraites du Date initial si en mode édition.
  const [startTime, setStartTime] = useState(
    initialBooking?.startDate
      ? `${String(initialBooking.startDate.getHours()).padStart(2, "0")}:${String(initialBooking.startDate.getMinutes()).padStart(2, "0")}`
      : "",
  );
  const [endTime, setEndTime] = useState(
    initialBooking?.endDate
      ? `${String(initialBooking.endDate.getHours()).padStart(2, "0")}:${String(initialBooking.endDate.getMinutes()).padStart(2, "0")}`
      : "",
  );

  // Step 2 — Client. Mêmes champs que sur le formulaire public
  // (cf. components/booking/booking-form.tsx) pour cohérence des données
  // saisies et des erreurs affichées.
  const {
    customer,
    setCustomer,
    isBusiness,
    setIsBusiness,
    businessFields,
    setBusinessFields,
    errors: customerErrors,
    stagedDocs,
    setStagedDocs,
    requiredFieldsFilled,
    validate: validateCustomerStep,
  } = useWizardCustomerForm(initialBooking?.customer, { mode });

  /** Liste des pays priorisés (DOM-TOM + France) en tête, comme sur le site
   *  public (cf. components/booking/booking-form.tsx). */
  const countryOptions = useMemo(() => getCountriesListWithPriority(), []);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Créneaux horaires de l'agence sélectionnée.
  const selectedAgency = agencies.find((a) => a.id === agencyId);
  const timeSlots = useMemo(() => {
    if (!selectedAgency?.hours) return [];
    return generateTimeSlots(selectedAgency.hours);
  }, [selectedAgency]);

  /** Applique un créneau "HH:MM" sur un Date (conserve le jour). */
  const applyTime = (
    date: Date | undefined,
    time: string,
  ): Date | undefined => {
    if (!date || !time) return date;
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Dates avec heures appliquées — utilisées pour le calcul du prix
  // et envoyées au serveur.
  const startDateWithTime = applyTime(startDate, startTime);
  const endDateWithTime = applyTime(endDate, endTime);

  // Options disponibles pour l'agence courante
  const agencyOptions = useMemo(
    () => optionsByAgency[agencyId] ?? [],
    [optionsByAgency, agencyId],
  );

  // Filtrage des véhicules par dispo sur les dates sélectionnées
  // (même règle que le site public). Tant que les deux dates ne sont
  // pas posées, on affiche toutes les voitures de l'agence.
  const vehiclesForAgency = useMemo(
    () => vehicles.filter((v) => v.agencyId === agencyId),
    [vehicles, agencyId],
  );
  const availableVehicles = useMemo(() => {
    if (!startDate || !endDate) return vehiclesForAgency;
    return vehiclesForAgency.filter((v) => {
      const bookings = bookingsByVehicle?.[v.id] ?? [];
      return isVehicleAvailable(v, startDate, endDate, bookings, {
        // En édition on exclut la résa courante (sinon elle se bloque
        // elle-même). Public-safe par défaut — en admin la gérante
        // peut modifier une résa déjà payée.
        excludeBookingId: initialBooking?.bookingId ?? null,
        allowExcludingPaid: !!initialBooking,
      });
    });
  }, [
    vehiclesForAgency,
    startDate,
    endDate,
    bookingsByVehicle,
    initialBooking,
  ]);

  // Si le véhicule présélectionné devient indispo après un changement
  // de dates, on le désélectionne pour forcer une nouvelle sélection.
  // (useEffect-like via direct comparison — évite l'écueil du state
  // stale ; on met à jour uniquement si la ref change.)
  const hasSelectedVehicleAvailable =
    !selectedVehicleId ||
    availableVehicles.some((v) => v.id === selectedVehicleId);
  if (
    startDate &&
    endDate &&
    selectedVehicleId &&
    !hasSelectedVehicleAvailable &&
    // Laisse le véhicule pré-rempli en édition même s'il n'apparaît plus
    // dans la liste filtrée (il peut devenir dispo avec de nouvelles dates).
    !initialBooking
  ) {
    // Reset différé pour éviter un "setState during render" React.
    queueMicrotask(() => setSelectedVehicleId(""));
  }

  // Quantités sélectionnées par option
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, number>
  >(initialBooking?.selectedOptions ?? {});

  const handleOptionChange = (optionId: string, quantity: number) => {
    setSelectedOptions((prev) => {
      const next = { ...prev };
      if (quantity <= 0) delete next[optionId];
      else next[optionId] = quantity;
      return next;
    });
  };

  // Prix/jour personnalisé — null = tarif automatique (paliers dégressifs).
  // Permet à la gérante d'appliquer un prix négocié.
  const [customPricePerDay, setCustomPricePerDay] = useState<number | null>(
    null,
  );

  // Calculate price — tout mémoïsé pour que React Compiler puisse
  // optimiser (pas de `let` mutable utilisé comme dépendance de memo).
  const priceQuoteResult = useMemo(() => {
    if (!startDateWithTime || !endDateWithTime || !selectedVehicle) {
      return { totalPrice: 0, totalDays: 0 };
    }
    return quotePrice(
      startDateWithTime,
      endDateWithTime,
      selectedVehicle.pricingTiers,
      selectedVehicle.pricePerDay,
    );
  }, [startDateWithTime, endDateWithTime, selectedVehicle]);

  const totalDays = priceQuoteResult.totalDays;
  const autoPricePerDay =
    totalDays > 0 ? priceQuoteResult.totalPrice / totalDays : 0;
  const vehiclePrice =
    customPricePerDay !== null
      ? customPricePerDay * totalDays
      : priceQuoteResult.totalPrice;

  const optionsTotal = useMemo(() => {
    const lines = agencyOptions
      .map((o) => {
        const qty = selectedOptions[o.id] ?? 0;
        if (qty <= 0) return null;
        return {
          unitPrice: o.price,
          priceType: o.priceType,
          quantity: qty,
          monthlyCap: o.capEnabled ? o.monthlyCap : null,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);
    return computeOptionsTotal(lines, totalDays);
  }, [agencyOptions, selectedOptions, totalDays]);

  const totalPrice = vehiclePrice + optionsTotal;

  const datesOrderValid =
    !startDate || !endDate || endDate.getTime() >= startDate.getTime();
  const canGoStep2 =
    !!startDate && !!endDate && !!selectedVehicleId && datesOrderValid;
  const canGoStep3 = canGoStep2;
  const canGoStep4 = requiredFieldsFilled;

  const selectedOptionsPayload = Object.entries(selectedOptions)
    .filter(([, qty]) => qty > 0)
    .map(([optionId, quantity]) => ({ optionId, quantity }));

  /** Customer enrichi des champs pro si la case est cochée + dates au
   *  format BDD. */
  const customerPayload = {
    ...customer,
    birthDate: frDateToISO(customer.birthDate),
    driverLicenseIssuedAt: customer.driverLicenseIssuedAt
      ? frDateToISO(customer.driverLicenseIssuedAt)
      : null,
    driverLicenseNumber: customer.driverLicenseNumber || null,
    driverLicenseCountry: customer.driverLicenseCountry || null,
    birthPlace: customer.birthPlace || null,
    address2: customer.address2 || null,
    companyName: isBusiness ? businessFields.companyName.trim() || null : null,
    siret: isBusiness ? businessFields.siret.replace(/\s/g, "") || null : null,
    vatNumber: isBusiness
      ? businessFields.vatNumber.replace(/\s/g, "").toUpperCase() || null
      : null,
  };

  /** Payload des pièces jointes en staging (mêmes infos que le site public). */
  const stagedDocumentsPayload = stagedDocsToPayload(stagedDocs);

  const handleSubmit = async () => {
    if (!startDateWithTime || !endDateWithTime || !selectedVehicleId) return;
    setSaving(true);
    setErrorMessage(null);

    if (isQuote) {
      // Devis : crée client + quote + génère PDF, puis ouvre le PDF
      // inline dans un nouvel onglet. IMPORTANT : on ouvre l'onglet
      // blank *tout de suite* (geste utilisateur actif) — si on attend
      // le retour du serveur, le navigateur considère que c'est une
      // pop-up programmée et la bloque.
      const previewTab = window.open("about:blank", "_blank");
      // On affiche immédiatement une page de chargement dans le nouvel
      // onglet : sans ça l'utilisateur voit un `about:blank` pendant
      // toute la durée de génération du PDF (~5-10s en cold start).
      if (previewTab) {
        previewTab.document.write(`
          <!DOCTYPE html>
          <html lang="fr">
            <head>
              <meta charset="utf-8" />
              <title>Génération du devis…</title>
              <style>
                html, body { margin: 0; height: 100%; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #334155; }
                body { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 18px; }
                .spinner { width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top-color: #111; border-radius: 50%; animation: spin 0.9s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                p { margin: 0; font-size: 15px; }
                small { color: #64748b; }
              </style>
            </head>
            <body>
              <div class="spinner"></div>
              <p><strong>Génération du devis…</strong></p>
              <small>Le PDF s'affichera ici dans quelques secondes.</small>
            </body>
          </html>
        `);
        previewTab.document.close();
      }

      const result = await createQuote({
        vehicleId: selectedVehicleId,
        agencyId,
        startDate: startDateWithTime.toISOString(),
        endDate: endDateWithTime.toISOString(),
        totalPrice,
        customer: customerPayload,
        selectedOptions: selectedOptionsPayload,
        stagedDocuments: stagedDocumentsPayload,
      });
      if (!result.ok || !result.documentId) {
        previewTab?.close();
        setErrorMessage(
          result.error ?? "Erreur lors de la génération du devis.",
        );
        setSaving(false);
        return;
      }
      const inlineUrl = await getDocumentInlineUrl(result.documentId);
      if (previewTab && inlineUrl) {
        previewTab.location.href = inlineUrl;
      } else if (inlineUrl) {
        // Popup bloqué malgré le geste utilisateur — on navigue vers
        // le devis via un lien programmatique (moins restrictif).
        const a = document.createElement("a");
        a.href = inlineUrl;
        a.target = "_blank";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      // Rend la main : on coupe le loader *avant* de naviguer, sinon le
      // temps de chargement de la page réservations maintient l'overlay.
      setSaving(false);
      router.push(
        fromDocuments ? "/admin/documents?tab=quote" : "/admin/reservations",
      );
      router.refresh();
      return;
    }

    if (isEdit && initialBooking) {
      const result = await updateManualBooking({
        bookingId: initialBooking.bookingId,
        vehicleId: selectedVehicleId,
        startDate: startDateWithTime.toISOString(),
        endDate: endDateWithTime.toISOString(),
        totalPrice,
        customer: customerPayload,
        selectedOptions: selectedOptionsPayload,
        stagedDocuments: stagedDocumentsPayload,
      });
      if (!result.ok) {
        setErrorMessage(result.error ?? "Erreur lors de la mise à jour.");
        setSaving(false);
        return;
      }
      router.push(`/admin/reservations/${initialBooking.bookingId}`);
      router.refresh();
    } else {
      // `createManualBooking` fait un redirect serveur vers /admin/reservations.
      await createManualBooking({
        vehicleId: selectedVehicleId,
        agencyId,
        startDate: startDateWithTime.toISOString(),
        endDate: endDateWithTime.toISOString(),
        totalPrice,
        customer: customerPayload,
        selectedOptions: selectedOptionsPayload,
        stagedDocuments: stagedDocumentsPayload,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {saving && <ContentOverlay />}

      <WizardSteps steps={STEPS} current={step} />

      {step === 1 && (
        <StepDatesVehicle
          agencies={agencies}
          agencyId={agencyId}
          setAgencyId={setAgencyId}
          isEdit={isEdit}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          timeSlots={timeSlots}
          datesOrderValid={datesOrderValid}
          availableVehicles={availableVehicles}
          selectedVehicleId={selectedVehicleId}
          setSelectedVehicleId={setSelectedVehicleId}
          selectedVehicle={selectedVehicle}
          totalDays={totalDays}
          totalPrice={totalPrice}
          autoPricePerDay={autoPricePerDay}
          customPricePerDay={customPricePerDay}
          setCustomPricePerDay={setCustomPricePerDay}
          canGoNext={canGoStep2}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepOptions
          agencyOptions={agencyOptions}
          selectedOptions={selectedOptions}
          onOptionQtyChange={handleOptionChange}
          totalDays={totalDays}
          vehiclePrice={vehiclePrice}
          optionsTotal={optionsTotal}
          totalPrice={totalPrice}
          canGoNext={canGoStep3}
          onPrev={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StepCustomer
          existingCustomers={existingCustomers}
          isEdit={isEdit}
          isQuote={isQuote}
          customer={customer}
          setCustomer={setCustomer}
          isBusiness={isBusiness}
          setIsBusiness={setIsBusiness}
          businessFields={businessFields}
          setBusinessFields={setBusinessFields}
          customerErrors={customerErrors}
          countryOptions={countryOptions}
          stagedDocs={stagedDocs}
          setStagedDocs={setStagedDocs}
          canGoNext={!!canGoStep4}
          onPrev={() => setStep(2)}
          onNext={() => {
            if (validateCustomerStep()) setStep(4);
          }}
        />
      )}

      {step === 4 && (
        <StepRecap
          selectedVehicle={selectedVehicle}
          startDateWithTime={startDateWithTime}
          endDateWithTime={endDateWithTime}
          totalDays={totalDays}
          vehiclePrice={vehiclePrice}
          optionsTotal={optionsTotal}
          totalPrice={totalPrice}
          selectedOptionsPayload={selectedOptionsPayload}
          agencyOptions={agencyOptions}
          isBusiness={isBusiness}
          businessFields={businessFields}
          customer={customer}
          errorMessage={errorMessage}
          saving={saving}
          isEdit={isEdit}
          isQuote={isQuote}
          onPrev={() => setStep(3)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}


