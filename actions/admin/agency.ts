"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/infrastructure/supabase/client";
import type { WeekSchedule } from "@/domain/agency";

interface UpdateAgencyInput {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  deliveryLabel: string;
  deliveryZones: string;
  schedule: WeekSchedule;
  interval: number;
  /** Durée de validité par défaut des devis (en jours, min 1). */
  quoteValidityDays: number;
}

export async function updateAgency(agencyId: string, input: UpdateAgencyInput) {
  const supabase = createAdminClient();

  // Derive open_time/close_time from schedule for backward compatibility
  const firstEnabledDay = Object.values(input.schedule.days).find(
    (d) => d.enabled
  );

  await supabase
    .from("agencies")
    .update({
      name: input.name,
      address: input.address,
      city: input.city,
      postal_code: input.postalCode || null,
      country: input.country || null,
      phone: input.phone,
      email: input.email,
      delivery_label: input.deliveryLabel,
      delivery_zones: input.deliveryZones,
      schedule: input.schedule,
      interval: input.interval,
      open_time: firstEnabledDay?.openTime ?? "07:00",
      close_time: firstEnabledDay?.closeTime ?? "22:00",
      quote_validity_days: Math.max(1, Math.round(input.quoteValidityDays)),
    })
    .eq("id", agencyId);

  revalidatePath("/admin/infos-agence");
}
