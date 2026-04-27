"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveContractForBooking } from "@/actions/admin/documents";
import type { ContractEditableFields } from "@/domain/contract";

interface Args {
  bookingId: string;
  initialFields: ContractEditableFields;
  initialCustomerSignature: string | null;
  loueurSignature: string | null;
}

/**
 * Encapsule l'état du formulaire d'éditeur de contrat (~25 champs +
 * signatures + erreur + horodatage de sauvegarde) et la soumission via
 * `saveContractForBooking`. Le caller récupère un `update(key)` typé qui
 * retourne un onChange handler pour `<Input />`.
 */
export function useContractForm({
  bookingId,
  initialFields,
  initialCustomerSignature,
  loueurSignature,
}: Args) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fields, setFields] = useState<ContractEditableFields>(initialFields);
  const [customerSignature, setCustomerSignature] = useState<string | null>(
    initialCustomerSignature,
  );
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const update =
    <K extends keyof ContractEditableFields>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveContractForBooking(bookingId, {
        fields: fields as Record<string, string | undefined>,
        customerSignature,
        loueurSignature,
      });
      if (!result.ok) {
        setError(result.error ?? "Erreur lors de l'enregistrement.");
        return;
      }
      setSavedAt(new Date());
      router.push(`/admin/reservations/${bookingId}`);
      router.refresh();
    });
  };

  return {
    pending,
    fields,
    update,
    customerSignature,
    setCustomerSignature,
    error,
    savedAt,
    submit,
  };
}
