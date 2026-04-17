"use client";

import { useMemo, useState } from "react";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import {
  PiCalendarBlank,
  PiCaretRight,
  PiCaretLeft,
  PiMinus,
  PiPlus,
} from "react-icons/pi";
import { formatDateCayenne } from "@/lib/format-date";
import { quotePrice, isVehicleAvailable } from "@/domain/vehicle";
import { computeOptionsTotal, computeOptionLineTotal } from "@/domain/option";
import type { BookingAvailabilityView } from "@/domain/vehicle";
import {
  createManualBooking,
  updateManualBooking,
} from "@/actions/admin/manual-booking";
import { createQuote } from "@/actions/admin/quote";
import { getDocumentInlineUrl } from "@/actions/admin/documents";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@/domain/vehicle";
import type { Agency } from "@/domain/agency";
import type { Option } from "@/domain/option";
import type { Customer } from "@/domain/customer";

/** Forme minimale d'un client existant, pour la sélection dans le wizard. */
export interface CustomerPickerOption
  extends Pick<
    Customer,
    | "id"
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "birthDate"
    | "address"
    | "postalCode"
    | "city"
    | "country"
  > {}

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
    address: string;
    postalCode: string;
    city: string;
    country: string;
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
  const isEdit = !!initialBooking;
  const isQuote = mode === "quote";
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialBooking?.startDate
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialBooking?.endDate
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    initialBooking?.vehicleId ?? ""
  );
  const [agencyId, setAgencyId] = useState(
    initialBooking?.agencyId ?? agencies[0]?.id ?? ""
  );

  // Step 2 — Client
  const [customer, setCustomer] = useState(
    initialBooking?.customer ?? {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      birthDate: "",
      address: "",
      postalCode: "",
      city: "",
      country: "France",
    }
  );

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Options disponibles pour l'agence courante
  const agencyOptions = optionsByAgency[agencyId] ?? [];

  // Filtrage des véhicules par dispo sur les dates sélectionnées
  // (même règle que le site public). Tant que les deux dates ne sont
  // pas posées, on affiche toutes les voitures de l'agence.
  const vehiclesForAgency = useMemo(
    () => vehicles.filter((v) => v.agencyId === agencyId),
    [vehicles, agencyId]
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>(
    initialBooking?.selectedOptions ?? {}
  );

  const handleOptionChange = (optionId: string, quantity: number) => {
    setSelectedOptions((prev) => {
      const next = { ...prev };
      if (quantity <= 0) delete next[optionId];
      else next[optionId] = quantity;
      return next;
    });
  };

  // Calculate price
  let vehiclePrice = 0;
  let totalDays = 0;
  if (startDate && endDate && selectedVehicle) {
    const result = quotePrice(
      startDate,
      endDate,
      selectedVehicle.pricingTiers,
      selectedVehicle.pricePerDay
    );
    vehiclePrice = result.totalPrice;
    totalDays = result.totalDays;
  }

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
  const canGoStep4 =
    customer.firstName &&
    customer.lastName &&
    customer.email &&
    customer.phone &&
    customer.birthDate &&
    customer.address &&
    customer.postalCode &&
    customer.city;

  const selectedOptionsPayload = Object.entries(selectedOptions)
    .filter(([, qty]) => qty > 0)
    .map(([optionId, quantity]) => ({ optionId, quantity }));

  const handleSubmit = async () => {
    if (!startDate || !endDate || !selectedVehicleId) return;
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
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPrice,
        customer,
        selectedOptions: selectedOptionsPayload,
      });
      if (!result.ok || !result.documentId) {
        previewTab?.close();
        setErrorMessage(result.error ?? "Erreur lors de la génération du devis.");
        setSaving(false);
        return;
      }
      const inlineUrl = await getDocumentInlineUrl(result.documentId);
      if (previewTab && inlineUrl) {
        previewTab.location.href = inlineUrl;
      } else if (inlineUrl) {
        // Popup bloqué malgré le geste utilisateur (extensions anti-pub
        // agressives) — on ouvre alors la preview dans l'onglet courant,
        // le router.push qui suit est simplement ignoré.
        window.location.href = inlineUrl;
        return;
      }
      // Rend la main : on coupe le loader *avant* de naviguer, sinon le
      // temps de chargement de la page réservations maintient l'overlay.
      setSaving(false);
      router.push("/admin/reservations");
      router.refresh();
      return;
    }

    if (isEdit && initialBooking) {
      const result = await updateManualBooking({
        bookingId: initialBooking.bookingId,
        vehicleId: selectedVehicleId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPrice,
        customer,
        selectedOptions: selectedOptionsPayload,
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
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPrice,
        customer,
        selectedOptions: selectedOptionsPayload,
      });
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomer((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {saving && <ContentOverlay />}

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s.num
                  ? "bg-black text-green"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {s.num}
            </div>
            <span
              className={`text-sm hidden sm:block ${
                step >= s.num ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-gray-300 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Dates + Véhicule */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dates et véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agencies.length > 1 && (
              <Field label={isEdit ? "Agence (non modifiable)" : "Agence"}>
                <select
                  value={agencyId}
                  onChange={(e) => setAgencyId(e.target.value)}
                  disabled={isEdit}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm disabled:bg-gray-50 disabled:text-muted-foreground"
                >
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Date de départ">
                <DatePickerButton
                  value={startDate}
                  onChange={(d) => {
                    setStartDate(d);
                    // Si la date de retour est avant la nouvelle date de départ, on la réinitialise
                    if (d && endDate && endDate.getTime() < d.getTime()) {
                      setEndDate(undefined);
                    }
                  }}
                  placeholder="Sélectionner"
                />
              </Field>
              <Field label="Date de retour">
                <DatePickerButton
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Sélectionner"
                  disabledBefore={startDate}
                />
              </Field>
            </div>

            {startDate && endDate && !datesOrderValid && (
              <p className="text-xs text-red-500">
                La date de retour doit être postérieure ou égale à la date de départ.
              </p>
            )}

            <Field label="Véhicule">
              {startDate && endDate && availableVehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
                  Aucun véhicule disponible sur ces dates. Modifiez la
                  période ou ajustez un blocage.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableVehicles.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                        selectedVehicleId === v.id
                          ? "border-green bg-green/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className="shrink-0 rounded overflow-hidden"
                        style={{ width: 50, height: 35 }}
                      >
                        <Image
                          src={v.img}
                          alt={`${v.brand} ${v.model}`}
                          width={50}
                          height={35}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {v.brand} {v.model}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {v.registrationPlate} · {v.pricePerDay}€/j
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Field>

            {totalPrice > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{totalDays} jour{totalDays > 1 ? "s" : ""}</span>
                  <span className="font-semibold">{Math.round(totalPrice)} €</span>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                disabled={!canGoStep2}
                onClick={() => setStep(2)}
              >
                Suivant
                <PiCaretRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Options */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Options additionnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agencyOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune option configurée pour cette agence.
              </p>
            ) : (
              <div className="space-y-3">
                {agencyOptions.map((option) => {
                  const qty = selectedOptions[option.id] ?? 0;
                  const line = computeOptionLineTotal(
                    {
                      unitPrice: option.price,
                      priceType: option.priceType,
                      quantity: qty,
                      monthlyCap: option.capEnabled ? option.monthlyCap : null,
                    },
                    totalDays
                  );
                  return (
                    <div
                      key={option.id}
                      className="flex items-start justify-between gap-4 py-3 border-b last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{option.name}</div>
                        {option.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {option.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.price.toFixed(2)} €{" "}
                          {option.priceType === "per_day" ? "/ jour" : "forfait"}
                          {qty > 0 && totalDays > 0 && (
                            <span className="ml-2 font-semibold text-foreground">
                              · {line.toFixed(2)} €
                            </span>
                          )}
                        </p>
                      </div>
                      <QtyStepper
                        value={qty}
                        min={0}
                        max={option.maxQuantity}
                        onChange={(v) => handleOptionChange(option.id, v)}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Véhicule ({totalDays} j)</span>
                <span className="font-semibold">{Math.round(vehiclePrice)} €</span>
              </div>
              {optionsTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Options</span>
                  <span className="font-semibold">{optionsTotal.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t">
                <span className="font-semibold">Total</span>
                <span className="font-bold">{Math.round(totalPrice)} €</span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setStep(1)}>
                <PiCaretLeft className="size-4" />
                Précédent
              </Button>
              <Button type="button" size="sm" disabled={!canGoStep3} onClick={() => setStep(3)}>
                Suivant
                <PiCaretRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Client */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingCustomers && existingCustomers.length > 0 && !isEdit && (
              <Field label="Client existant (optionnel)">
                <select
                  value=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const c = existingCustomers.find((x) => x.id === id);
                    if (!c) return;
                    // Auto-remplissage de tous les champs à partir du client
                    // choisi. L'utilisateur peut ensuite ajuster avant de
                    // valider — le backend fera un upsert par email.
                    setCustomer({
                      firstName: c.firstName,
                      lastName: c.lastName,
                      email: c.email,
                      phone: c.phone,
                      birthDate: c.birthDate,
                      address: c.address,
                      postalCode: c.postalCode,
                      city: c.city,
                      country: c.country,
                    });
                  }}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm cursor-pointer"
                >
                  <option value="">
                    — Sélectionner pour pré-remplir —
                  </option>
                  {existingCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} · {c.email}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom">
                <Input name="firstName" value={customer.firstName} onChange={handleCustomerChange} placeholder="Jean" required />
              </Field>
              <Field label="Nom">
                <Input name="lastName" value={customer.lastName} onChange={handleCustomerChange} placeholder="Dupont" required />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email">
                <Input name="email" type="email" value={customer.email} onChange={handleCustomerChange} placeholder="jean@exemple.com" required />
              </Field>
              <Field label="Téléphone">
                <Input name="phone" value={customer.phone} onChange={handleCustomerChange} placeholder="+594 6 94 00 00 00" required />
              </Field>
            </div>
            <Field label="Date de naissance">
              <Input name="birthDate" type="date" value={customer.birthDate} onChange={handleCustomerChange} required />
            </Field>
            <Field label="Adresse">
              <Input name="address" value={customer.address} onChange={handleCustomerChange} placeholder="123 rue de la Paix" required />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Code postal">
                <Input name="postalCode" value={customer.postalCode} onChange={handleCustomerChange} placeholder="97300" required />
              </Field>
              <Field label="Ville">
                <Input name="city" value={customer.city} onChange={handleCustomerChange} placeholder="Cayenne" required />
              </Field>
              <Field label="Pays">
                <Input name="country" value={customer.country} onChange={handleCustomerChange} placeholder="France" required />
              </Field>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setStep(2)}>
                <PiCaretLeft className="size-4" />
                Précédent
              </Button>
              <Button type="button" size="sm" disabled={!canGoStep4} onClick={() => setStep(4)}>
                Suivant
                <PiCaretRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Récapitulatif */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Réservation</h4>
              <Row label="Véhicule" value={selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : ""} />
              <Row label="Plaque" value={selectedVehicle?.registrationPlate ?? ""} />
              {startDate && <Row label="Départ" value={formatDateCayenne(startDate.toISOString(), "dd MMMM yyyy")} />}
              {endDate && <Row label="Retour" value={formatDateCayenne(endDate.toISOString(), "dd MMMM yyyy")} />}
              <Row label="Durée" value={`${totalDays} jour${totalDays > 1 ? "s" : ""}`} />
              <Row label="Véhicule" value={`${Math.round(vehiclePrice)} €`} />
              {optionsTotal > 0 && (
                <Row label="Options" value={`${optionsTotal.toFixed(2)} €`} />
              )}
              <Row label="Total" value={`${Math.round(totalPrice)} €`} bold />
            </div>

            {selectedOptionsPayload.length > 0 && (
              <div className="border-t pt-3 space-y-3 text-sm">
                <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Options sélectionnées</h4>
                {selectedOptionsPayload.map((sel) => {
                  const opt = agencyOptions.find((o) => o.id === sel.optionId);
                  if (!opt) return null;
                  return (
                    <Row
                      key={sel.optionId}
                      label={`${opt.name}${sel.quantity > 1 ? ` ×${sel.quantity}` : ""}`}
                      value={`${computeOptionLineTotal(
                        {
                          unitPrice: opt.price,
                          priceType: opt.priceType,
                          quantity: sel.quantity,
                          monthlyCap: opt.capEnabled ? opt.monthlyCap : null,
                        },
                        totalDays
                      ).toFixed(2)} €`}
                    />
                  );
                })}
              </div>
            )}

            <div className="border-t pt-3 space-y-3 text-sm">
              <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Client</h4>
              <Row label="Nom" value={`${customer.firstName} ${customer.lastName}`} />
              <Row label="Email" value={customer.email} />
              <Row label="Téléphone" value={customer.phone} />
              <Row label="Adresse" value={`${customer.address}, ${customer.postalCode} ${customer.city}`} />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-500 pt-2">{errorMessage}</p>
            )}

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setStep(3)}>
                <PiCaretLeft className="size-4" />
                Précédent
              </Button>
              <Button type="button" size="sm" disabled={saving} onClick={handleSubmit}>
                {saving
                  ? isQuote
                    ? "Génération…"
                    : isEdit
                      ? "Enregistrement…"
                      : "Création..."
                  : isQuote
                    ? "Générer le devis"
                    : isEdit
                      ? "Enregistrer les modifications"
                      : "Confirmer la réservation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DatePickerButton({
  value,
  onChange,
  placeholder,
  disabledBefore,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
  disabledBefore?: Date;
}) {
  const [open, setOpen] = useState(false);
  const minDate = disabledBefore
    ? new Date(
        disabledBefore.getFullYear(),
        disabledBefore.getMonth(),
        disabledBefore.getDate()
      )
    : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm flex items-center gap-2 cursor-pointer hover:border-gray-400 transition-colors text-left"
        >
          <PiCalendarBlank className="size-4 text-muted-foreground shrink-0" />
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value ? formatDateCayenne(value.toISOString(), "dd MMM yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          disabled={minDate ? { before: minDate } : undefined}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          locale={fr}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold text-lg" : "font-medium"}>{value}</span>
    </div>
  );
}

function QtyStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="size-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <PiMinus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="size-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <PiPlus className="size-3.5" />
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
