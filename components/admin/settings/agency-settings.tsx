"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { updateAgency } from "@/actions/admin/agency";
import { PiPlus } from "react-icons/pi";
import type { Agency } from "@/domain/agency";
import { useScheduleState } from "./agency/use-schedule-state";
import { InfoCard } from "./agency/info-card";
import { ContactCard } from "./agency/contact-card";
import { ScheduleCard } from "./agency/schedule-card";
import { SignatureCard } from "./agency/signature-card";
import { DeliveryCard } from "./agency/delivery-card";
import { QuoteCard } from "./agency/quote-card";
import { SmsCard } from "./agency/sms-card";

interface Props {
  agency: Agency;
  onOpenCreateDialog?: () => void;
}

/**
 * Container des paramètres d'une agence : possède les états de tous les
 * champs simples + délègue la logique horaires à `useScheduleState`. Chaque
 * card est un composant présentational dédié sous `./agency/`.
 */
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
  const [intervalVal, setIntervalVal] = useState(
    String(agency.hours.interval),
  );
  const [quoteValidityDays, setQuoteValidityDays] = useState(
    String(agency.quoteValidityDays ?? 30),
  );
  const [rib, setRib] = useState(agency.rib ?? "");
  const [showRibOnQuote, setShowRibOnQuote] = useState(
    agency.showRibOnQuote ?? false,
  );
  const [smsEnabled, setSmsEnabled] = useState(agency.smsEnabled ?? false);
  const [smsAdminPhone, setSmsAdminPhone] = useState(
    agency.smsAdminPhone ?? "",
  );

  const schedule = useScheduleState(agency.schedule);

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
      schedule: schedule.buildSchedule(),
      interval: Number(intervalVal) || 30,
      quoteValidityDays: Number(quoteValidityDays) || 30,
      rib,
      showRibOnQuote,
      smsEnabled,
      smsAdminPhone,
    });
    router.refresh();
    setSaving(false);
  };

  return (
    <>
      {saving && <ContentOverlay />}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <InfoCard
            name={name}
            setName={setName}
            address={address}
            setAddress={setAddress}
            postalCode={postalCode}
            setPostalCode={setPostalCode}
            city={city}
            setCity={setCity}
            country={country}
            setCountry={setCountry}
          />
          <ContactCard
            phone={phone}
            setPhone={setPhone}
            email={email}
            setEmail={setEmail}
          />
          <ScheduleCard
            intervalVal={intervalVal}
            setIntervalVal={setIntervalVal}
            schedule={schedule}
          />
          <SignatureCard
            agencyId={agency.id}
            defaultSignature={agency.defaultLoueurSignature ?? null}
          />
          <DeliveryCard
            deliveryLabel={deliveryLabel}
            setDeliveryLabel={setDeliveryLabel}
            deliveryZones={deliveryZones}
            setDeliveryZones={setDeliveryZones}
          />
          <QuoteCard
            quoteValidityDays={quoteValidityDays}
            setQuoteValidityDays={setQuoteValidityDays}
            rib={rib}
            setRib={setRib}
            showRibOnQuote={showRibOnQuote}
            setShowRibOnQuote={setShowRibOnQuote}
          />
          <SmsCard
            smsEnabled={smsEnabled}
            setSmsEnabled={setSmsEnabled}
            smsAdminPhone={smsAdminPhone}
            setSmsAdminPhone={setSmsAdminPhone}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          {onOpenCreateDialog ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
              onClick={onOpenCreateDialog}
              disabled={saving}
            >
              <PiPlus className="size-4" />
              Ajouter une agence
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <Button
            type="submit"
            size="sm"
            className="w-full sm:w-auto"
            disabled={saving}
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </>
  );
}
