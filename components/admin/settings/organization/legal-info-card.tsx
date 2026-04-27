"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { useLegalForm } from "./use-legal-form";

interface Props {
  form: ReturnType<typeof useLegalForm>;
}

/** Card "Informations légales" — données affichées sur factures & contrats
 *  (forme juridique, capital, RCS, SIRET, TVA intracom + toggle TVA). */
export function LegalInfoCard({ form }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Informations légales (factures & contrats)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border border-gray-200 p-3 bg-gray-50">
          <div>
            <p className="text-sm font-medium">Assujetti à la TVA</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Si activé, les factures affichent le détail HT / TVA (20 %) /
              TTC. Sinon, le total est indiqué net avec la mention « TVA non
              applicable, art. 293 B du CGI ».
            </p>
          </div>
          <Switch
            checked={form.vatEnabled}
            onCheckedChange={form.setVatEnabled}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Forme juridique">
            <Input
              value={form.legalForm}
              onChange={(e) => form.setLegalForm(e.target.value)}
              placeholder="Ex : SARL"
            />
          </Field>
          <Field label="Capital social">
            <Input
              value={form.capitalSocial}
              onChange={(e) => form.setCapitalSocial(e.target.value)}
              placeholder="Ex : 1 000,00 euros"
            />
          </Field>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="RCS — Ville">
            <Input
              value={form.rcsCity}
              onChange={(e) => form.setRcsCity(e.target.value)}
              placeholder="Ex : Paris"
            />
          </Field>
          <Field label="RCS — Numéro">
            <Input
              value={form.rcsNumber}
              onChange={(e) => form.setRcsNumber(e.target.value)}
              placeholder="Ex : 123 456 789"
            />
          </Field>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="SIRET">
            <Input
              value={form.siret}
              onChange={(e) => form.setSiret(e.target.value)}
              placeholder="Ex : 12345678900012"
            />
          </Field>
          <Field label="TVA Intracommunautaire">
            <Input
              value={form.tvaIntracom}
              onChange={(e) => form.setTvaIntracom(e.target.value)}
              placeholder="Ex : FR00123456789"
            />
          </Field>
        </div>
      </CardContent>
    </Card>
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
