"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createBlockedPeriod,
  updateBlockedPeriod,
  type BlockedPeriodWithVehicle,
} from "@/actions/admin/blocked-periods";
import {
  blockedPeriodSchema,
  type BlockedPeriodFormValues,
} from "./blocked-period-schema";

interface Args {
  open: boolean;
  period: BlockedPeriodWithVehicle | null;
  onSaved: () => void;
}

/**
 * Encapsule la gestion du formulaire indisponibilité : `useForm` + reset à
 * chaque ouverture/changement de la période éditée + soumission via
 * `createBlockedPeriod` ou `updateBlockedPeriod`.
 */
export function useBlockedPeriodForm({ open, period, onSaved }: Args) {
  const [saving, setSaving] = useState(false);
  const form = useForm<BlockedPeriodFormValues>({
    resolver: zodResolver(blockedPeriodSchema),
    defaultValues: {
      vehicleId: "",
      start: new Date(),
      end: undefined,
      comment: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        vehicleId: period?.vehicle_id ?? "",
        start: period?.start ? new Date(period.start) : new Date(),
        end: period?.end ? new Date(period.end) : undefined,
        comment: period?.comment ?? "",
      });
    }
  }, [open, period, form]);

  const submit = form.handleSubmit(async (data) => {
    setSaving(true);
    const payload = {
      vehicleId: data.vehicleId,
      start: data.start.toISOString(),
      end: data.end.toISOString(),
      comment: data.comment,
    };
    if (period) {
      await updateBlockedPeriod(period.id, payload);
    } else {
      await createBlockedPeriod(payload);
    }
    setSaving(false);
    form.reset();
    onSaved();
  });

  return { form, saving, submit };
}
