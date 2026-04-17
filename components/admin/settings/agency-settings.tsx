"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { updateAgency } from "@/actions/admin/agency";
import { PiPlus, PiX, PiCopy } from "react-icons/pi";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Agency, WeekSchedule, TimeSlot } from "@/domain/agency";
import { getCountriesList } from "@/lib/countries";
import { LoueurSignatureField } from "./loueur-signature-field";

const DAYS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

interface DayState {
  enabled: boolean;
  slots: TimeSlot[];
}

function getDefaultSlot(): TimeSlot {
  return { openTime: "07:00", closeTime: "22:00" };
}

function dayFromSchedule(schedule: WeekSchedule, day: string): DayState {
  const d = schedule.days[day];
  if (!d) return { enabled: false, slots: [getDefaultSlot()] };
  const slots =
    d.slots && d.slots.length > 0
      ? d.slots
      : [{ openTime: d.openTime, closeTime: d.closeTime }];
  return { enabled: d.enabled, slots };
}

const DEFAULT_SCHEDULE: WeekSchedule = {
  allDays: true,
  days: Object.fromEntries(
    DAYS.map((d) => [
      d,
      {
        enabled: true,
        openTime: "07:00",
        closeTime: "22:00",
        slots: [{ openTime: "07:00", closeTime: "22:00" }],
      },
    ]),
  ),
};

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

interface Props {
  agency: Agency;
  onOpenCreateDialog?: () => void;
}

export function AgencySettings({ agency, onOpenCreateDialog }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(agency.name);
  const [address, setAddress] = useState(agency.address);
  const [city, setCity] = useState(agency.city);
  const [postalCode, setPostalCode] = useState(agency.postalCode ?? "");
  const [country, setCountry] = useState(agency.country ?? "FR");
  const [phone, setPhone] = useState(agency.phone ?? "");
  const [email, setEmail] = useState(agency.email ?? "");
  const [deliveryLabel, setDeliveryLabel] = useState(
    agency.deliveryLabel ?? "",
  );
  const [deliveryZones, setDeliveryZones] = useState(
    agency.deliveryZones ?? "",
  );
  const [intervalVal, setIntervalVal] = useState(String(agency.hours.interval));
  const [quoteValidityDays, setQuoteValidityDays] = useState(
    String(agency.quoteValidityDays ?? 30)
  );

  const initSchedule = agency.schedule ?? DEFAULT_SCHEDULE;
  const [allDays, setAllDays] = useState(initSchedule.allDays);
  const [days, setDays] = useState<Record<string, DayState>>(
    Object.fromEntries(DAYS.map((d) => [d, dayFromSchedule(initSchedule, d)])),
  );

  const allEnabled = DAYS.every((d) => days[d].enabled);
  const slotsEqual = (a: TimeSlot[], b: TimeSlot[]) =>
    a.length === b.length &&
    a.every(
      (s, i) => s.openTime === b[i].openTime && s.closeTime === b[i].closeTime,
    );
  const allSameSlots =
    allEnabled &&
    DAYS.every((d) => slotsEqual(days[d].slots, days[DAYS[0]].slots));

  const handleAllDaysToggle = (checked: boolean) => {
    setAllDays(checked);
    if (checked) {
      const ref = days[DAYS[0]].slots;
      setDays((prev) => {
        const updated = { ...prev };
        for (const d of DAYS) {
          updated[d] = { enabled: true, slots: ref.map((s) => ({ ...s })) };
        }
        return updated;
      });
    }
  };

  const handleDayToggle = (day: string, enabled: boolean) => {
    setAllDays(false);
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled,
        slots:
          prev[day].slots.length > 0 ? prev[day].slots : [getDefaultSlot()],
      },
    }));
  };

  const handleSlotChange = (
    day: string,
    slotIndex: number,
    field: "openTime" | "closeTime",
    value: string,
  ) => {
    if (allDays && allSameSlots) {
      setDays((prev) => {
        const updated = { ...prev };
        for (const d of DAYS) {
          const newSlots = [...updated[d].slots];
          newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
          updated[d] = { ...updated[d], slots: newSlots };
        }
        return updated;
      });
    } else {
      setDays((prev) => {
        const newSlots = [...prev[day].slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
        return { ...prev, [day]: { ...prev[day], slots: newSlots } };
      });
    }
  };

  const addSlot = (day: string) => {
    setDays((prev) => {
      const lastSlot = prev[day].slots[prev[day].slots.length - 1];
      const newSlot: TimeSlot = {
        openTime: lastSlot?.closeTime ?? "12:00",
        closeTime: "18:00",
      };
      return {
        ...prev,
        [day]: { ...prev[day], slots: [...prev[day].slots, newSlot] },
      };
    });
  };

  const removeSlot = (day: string, slotIndex: number) => {
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== slotIndex),
      },
    }));
  };

  const buildSchedule = (): WeekSchedule => ({
    allDays: allDays && allSameSlots,
    days: Object.fromEntries(
      DAYS.map((d) => [
        d,
        {
          enabled: days[d].enabled,
          openTime: days[d].slots[0]?.openTime ?? "07:00",
          closeTime:
            days[d].slots[days[d].slots.length - 1]?.closeTime ?? "22:00",
          slots: days[d].slots,
        },
      ]),
    ),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateAgency(agency.id, {
      name,
      address,
      city,
      postalCode,
      country,
      phone,
      email,
      deliveryLabel,
      deliveryZones,
      schedule: buildSchedule(),
      interval: Number(intervalVal) || 30,
      quoteValidityDays: Number(quoteValidityDays) || 30,
    });
    router.refresh();
    setSaving(false);
  };

  const [copyFrom, setCopyFrom] = useState<string | null>(null);
  const [copyTargets, setCopyTargets] = useState<Set<string>>(new Set());

  const openCopyPopover = (day: string) => {
    setCopyFrom(day);
    setCopyTargets(new Set());
  };

  const toggleCopyTarget = (day: string) => {
    setCopyTargets((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const toggleAllCopyTargets = () => {
    const otherDays = DAYS.filter((d) => d !== copyFrom);
    if (copyTargets.size === otherDays.length) {
      setCopyTargets(new Set());
    } else {
      setCopyTargets(new Set(otherDays));
    }
  };

  const applyCopy = () => {
    if (!copyFrom) return;
    const sourceSlots = days[copyFrom].slots;
    setDays((prev) => {
      const updated = { ...prev };
      for (const target of copyTargets) {
        updated[target] = {
          enabled: true,
          slots: sourceSlots.map((s) => ({ ...s })),
        };
      }
      return updated;
    });
    setCopyFrom(null);
    setCopyTargets(new Set());
  };

  const renderSlots = (day: string, dayState: DayState) => (
    <div className="flex flex-col gap-2">
      {dayState.slots.map((slot, i) => (
        <div key={i} className="flex items-center gap-1">
          <TimeSelect
            value={slot.openTime}
            onChange={(v) => handleSlotChange(day, i, "openTime", v)}
          />
          <span className="text-xs text-muted-foreground">—</span>
          <TimeSelect
            value={slot.closeTime}
            onChange={(v) => handleSlotChange(day, i, "closeTime", v)}
          />
          {dayState.slots.length > 1 && (
            <button
              type="button"
              onClick={() => removeSlot(day, i)}
              className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <PiX className="size-3.5" />
            </button>
          )}
          {i === dayState.slots.length - 1 && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => addSlot(day)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                    >
                      <PiPlus className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ajouter un créneau horaire</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Popover
                open={copyFrom === day}
                onOpenChange={(open) => {
                  if (open) openCopyPopover(day);
                  else {
                    setCopyFrom(null);
                    setCopyTargets(new Set());
                  }
                }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <PopoverTrigger asChild>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                        >
                          <PiCopy className="size-4" />
                        </button>
                      </TooltipTrigger>
                    </PopoverTrigger>
                    <TooltipContent>
                      <p>Copier les créneaux vers</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <PopoverContent className="w-56 p-0" align="start">
                  <div className="p-3">
                    <p className="text-xs font-medium uppercase text-muted-foreground pb-3">
                      Copier les créneaux vers
                    </p>
                    <div className="space-y-2">
                      {/* Select all */}
                      <label className="flex items-center gap-2 rounded-md p-1 hover:bg-muted cursor-pointer">
                        <Checkbox
                          checked={copyTargets.size === DAYS.length - 1}
                          onCheckedChange={toggleAllCopyTargets}
                        />
                        <span className="text-sm font-medium">
                          Tout sélectionner
                        </span>
                      </label>
                      {/* Each day */}
                      {DAYS.map((d) => {
                        const isCurrent = d === day;
                        return (
                          <label
                            key={d}
                            className={`flex items-center gap-2 rounded-md p-1 capitalize ${
                              isCurrent
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-muted cursor-pointer"
                            }`}
                          >
                            <Checkbox
                              checked={isCurrent || copyTargets.has(d)}
                              disabled={isCurrent}
                              onCheckedChange={() => {
                                if (!isCurrent) toggleCopyTarget(d);
                              }}
                            />
                            <span className="text-sm">{d}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t flex justify-end gap-2 p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setCopyFrom(null);
                        setCopyTargets(new Set());
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      disabled={copyTargets.size === 0}
                      onClick={applyCopy}
                    >
                      Appliquer
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {saving && <ContentOverlay />}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 min-[1150px]:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Informations de l&apos;agence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Nom de l'agence">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Get Easy"
                  required
                />
              </Field>
              <Field label="Adresse">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="4 Lotissement Mortin"
                  required
                />
              </Field>
              <div className="grid gap-4 min-[1150px]:grid-cols-2">
                <Field label="Code postal">
                  <Input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="97354"
                  />
                </Field>
                <Field label="Localité">
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Rémire-Montjoly"
                    required
                  />
                </Field>
              </div>
              <Field label="Pays">
                <CountrySelect value={country} onChange={setCountry} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Téléphone">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 94 03 06 70"
                  required
                />
              </Field>
              <Field label="Email">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="contact@geteasylocation.com"
                  required
                />
              </Field>
              <Field label="Intervalle des créneaux (minutes)">
                <Input
                  value={intervalVal}
                  onChange={(e) => setIntervalVal(e.target.value)}
                  type="number"
                  placeholder="30"
                  required
                />
              </Field>
              <Field label="Validité des devis (jours)">
                <Input
                  value={quoteValidityDays}
                  onChange={(e) => setQuoteValidityDays(e.target.value)}
                  type="number"
                  min={1}
                  placeholder="30"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Horaires d&apos;ouverture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Switch
                  checked={allDays && allSameSlots}
                  onCheckedChange={handleAllDaysToggle}
                />
                <span className="text-sm font-medium">
                  Tous les jours (mêmes horaires)
                </span>
                {allDays && allSameSlots && (
                  <div className="ml-auto">
                    {renderSlots(DAYS[0], days[DAYS[0]])}
                  </div>
                )}
              </div>

              {!(allDays && allSameSlots) && (
                <div className="space-y-3">
                  {DAYS.map((day) => {
                    const dayState = days[day];
                    return (
                      <div
                        key={day}
                        className={`flex gap-3 ${dayState.slots.length > 1 ? "items-start" : "items-center"}`}
                      >
                        <Switch
                          checked={dayState.enabled}
                          onCheckedChange={(checked) =>
                            handleDayToggle(day, checked)
                          }
                        />
                        <span className="text-sm capitalize w-24 shrink-0">
                          {day}
                        </span>
                        {dayState.enabled ? (
                          renderSlots(day, dayState)
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Fermé
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Signature / tampon du Loueur
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Utilisée par défaut dans les contrats de location de cette
                agence. <br />
                Propre à chaque agence : modifiable agence par agence.
              </p>
            </CardHeader>
            <CardContent>
              <LoueurSignatureField
                agencyId={agency.id}
                value={agency.defaultLoueurSignature ?? null}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Livraison (optionnel)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Laissez vide pour ne pas afficher la section livraison sur le
                site.
              </p>
              <Field label="Intitulé">
                <Input
                  value={deliveryLabel}
                  onChange={(e) => setDeliveryLabel(e.target.value)}
                  placeholder="Livraison gratuite"
                />
              </Field>
              <Field label="Zones de livraison">
                <Textarea
                  value={deliveryZones}
                  onChange={(e) => setDeliveryZones(e.target.value)}
                  placeholder="Cayenne, Rémire-Montjoly, Matoury et Aéroport"
                  rows={3}
                />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          {onOpenCreateDialog ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onOpenCreateDialog}
              disabled={saving}
            >
              <PiPlus className="size-4" />
              Ajouter une agence
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </>
  );
}

function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-gray-300 px-2 text-sm cursor-pointer"
    >
      {TIME_SLOTS.map((slot) => (
        <option key={slot} value={slot}>
          {slot}
        </option>
      ))}
    </select>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  // Priorité : DOM-TOM + France métropole en tête, reste par ordre alphabétique.
  const all = getCountriesList();
  const priority = ["FR", "GF", "MQ", "GP", "RE", "YT"];
  const top = priority
    .map((code) => all.find((c) => c.value === code))
    .filter(Boolean) as { value: string; label: string }[];
  const rest = all.filter((c) => !priority.includes(c.value));
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
    >
      {top.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
      <option disabled>──────────</option>
      {rest.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
