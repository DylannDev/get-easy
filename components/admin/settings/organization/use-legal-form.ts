"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAgencyLegalDetails } from "@/actions/admin/agency-details";
import type { Agency } from "@/domain/agency";

/** Encapsule l'état des champs "infos légales" de l'agence (forme juridique,
 *  capital, RCS, SIRET, TVA intracom, assujettissement TVA) + le submit
 *  vers `updateAgencyLegalDetails`. */
export function useLegalForm(agency: Agency) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [legalForm, setLegalForm] = useState(agency.legalForm ?? "");
  const [capitalSocial, setCapitalSocial] = useState(
    agency.capitalSocial ?? "",
  );
  const [rcsCity, setRcsCity] = useState(agency.rcsCity ?? "");
  const [rcsNumber, setRcsNumber] = useState(agency.rcsNumber ?? "");
  const [siret, setSiret] = useState(agency.siret ?? "");
  const [tvaIntracom, setTvaIntracom] = useState(agency.tvaIntracom ?? "");
  const [vatEnabled, setVatEnabled] = useState(agency.vatEnabled ?? false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateAgencyLegalDetails(agency.id, {
      legalForm: legalForm || null,
      capitalSocial: capitalSocial || null,
      rcsCity: rcsCity || null,
      rcsNumber: rcsNumber || null,
      siret: siret || null,
      tvaIntracom: tvaIntracom || null,
      vatEnabled,
    });
    router.refresh();
    setSaving(false);
  };

  return {
    saving,
    legalForm,
    setLegalForm,
    capitalSocial,
    setCapitalSocial,
    rcsCity,
    setRcsCity,
    rcsNumber,
    setRcsNumber,
    siret,
    setSiret,
    tvaIntracom,
    setTvaIntracom,
    vatEnabled,
    setVatEnabled,
    submit,
  };
}
