"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveInspectionReport,
  signInspectionReport,
} from "@/actions/admin/inspection";
import type {
  FuelLevel,
  InspectionReport,
  InspectionType,
} from "@/domain/inspection";

interface Args {
  bookingId: string;
  type: InspectionType;
  initialReport: InspectionReport | null;
}

/**
 * Encapsule l'état du formulaire d'état des lieux (kilométrage, carburant,
 * notes, signature) + les actions associées (`save`, `sign`, `ensureReport`).
 * Le `ensureReport` crée le report en BDD si nécessaire et renvoie son ID,
 * indispensable avant tout upload de photo.
 */
export function useInspectionForm({ bookingId, type, initialReport }: Args) {
  const router = useRouter();
  const [mileage, setMileage] = useState(
    initialReport?.mileage?.toString() ?? "",
  );
  const [fuelLevel, setFuelLevel] = useState<FuelLevel | "">(
    initialReport?.fuelLevel ?? "",
  );
  const [notes, setNotes] = useState(initialReport?.notes ?? "");
  const [signature, setSignature] = useState<string | null>(
    initialReport?.customerSignature ?? null,
  );

  const buildReportInput = () => ({
    bookingId,
    type,
    mileage: mileage ? Number(mileage) : null,
    fuelLevel: fuelLevel || null,
    notes: notes || null,
  });

  /** Crée le report si inexistant, renvoie son ID. */
  const ensureReport = async (): Promise<string | undefined> => {
    if (initialReport?.id) return initialReport.id;
    const result = await saveInspectionReport(buildReportInput());
    return result.reportId;
  };

  const save = async () => {
    await saveInspectionReport(buildReportInput());
    router.refresh();
  };

  const sign = async () => {
    if (!initialReport?.id || !signature) return;
    await saveInspectionReport(buildReportInput());
    await signInspectionReport(initialReport.id, signature, bookingId);
    router.refresh();
  };

  return {
    mileage,
    setMileage,
    fuelLevel,
    setFuelLevel,
    notes,
    setNotes,
    signature,
    setSignature,
    ensureReport,
    save,
    sign,
  };
}
