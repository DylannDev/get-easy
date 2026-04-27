"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAgency } from "@/actions/admin/create-agency";
import { deleteAgency } from "@/actions/admin/delete-agency";

interface NewAgencyDraft {
  name: string;
  address: string;
  city: string;
}

const EMPTY: NewAgencyDraft = { name: "", address: "", city: "" };

interface Args {
  initialAgencyId: string;
  /** Setter exposé par le caller — utilisé pour repositionner sur la 1re
   *  agence après suppression de l'agence courante. */
  onAfterDelete: (newId: string) => void;
  fallbackAgencyId: string;
}

/** Encapsule la création/suppression d'agence + le draft du formulaire de
 *  création + l'état `saving` partagé. Le caller gère la navigation entre
 *  agences ; ce hook se contente des side effects. */
export function useAgencyCrud({
  initialAgencyId,
  onAfterDelete,
  fallbackAgencyId,
}: Args) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<NewAgencyDraft>(EMPTY);

  const isDraftValid =
    draft.name.trim() !== "" &&
    draft.address.trim() !== "" &&
    draft.city.trim() !== "";

  const updateDraft = (patch: Partial<NewAgencyDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const create = async () => {
    if (!isDraftValid) return;
    setSaving(true);
    await createAgency(draft);
    setDraft(EMPTY);
    setSaving(false);
    router.refresh();
  };

  const remove = async () => {
    setSaving(true);
    await deleteAgency(initialAgencyId);
    onAfterDelete(fallbackAgencyId);
    setSaving(false);
    router.refresh();
  };

  return {
    saving,
    draft,
    updateDraft,
    isDraftValid,
    resetDraft: () => setDraft(EMPTY),
    create,
    remove,
  };
}
