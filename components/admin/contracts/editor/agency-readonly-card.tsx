"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PiLock } from "react-icons/pi";

export interface AgencyReadOnly {
  name: string;
  legalForm: string | null;
  capitalSocial: string | null;
  address: string;
  postalCode: string | null;
  city: string;
  country: string | null;
  rcsCity: string | null;
  rcsNumber: string | null;
  siret: string | null;
  phone: string | null;
  email: string | null;
}

interface Props {
  agency: AgencyReadOnly;
}

/** Card "Loueur" en lecture seule — toutes les valeurs viennent de la
 *  fiche agence et ne sont modifiables que là-bas. */
export function AgencyReadOnlyCard({ agency }: Props) {
  const agencyAddress = [
    agency.address,
    [agency.postalCode, agency.city].filter(Boolean).join(" "),
    agency.country,
  ]
    .filter(Boolean)
    .join(", ");
  const rcsFmt =
    agency.rcsCity && agency.rcsNumber
      ? `${agency.rcsCity} ${agency.rcsNumber}`
      : "";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base flex items-center gap-2">
          <PiLock className="size-4 text-muted-foreground" />
          Loueur (modifiable dans Infos organisation)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 min-[1150px]:grid-cols-2">
          <ReadOnlyField label="Dénomination" value={agency.name} />
          <ReadOnlyField label="Forme juridique" value={agency.legalForm ?? ""} />
          <ReadOnlyField
            label="Capital social"
            value={agency.capitalSocial ?? ""}
          />
          <ReadOnlyField label="Adresse" value={agencyAddress} />
          <ReadOnlyField label="RCS" value={rcsFmt} />
          <ReadOnlyField label="SIRET" value={agency.siret ?? ""} />
          <ReadOnlyField label="Téléphone" value={agency.phone ?? ""} />
          <ReadOnlyField label="Email" value={agency.email ?? ""} />
        </div>
      </CardContent>
    </Card>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm flex items-center text-muted-foreground">
        {value || "—"}
      </div>
    </div>
  );
}
