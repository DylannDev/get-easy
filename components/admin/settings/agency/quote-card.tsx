"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "./field";

interface Props {
  quoteValidityDays: string;
  setQuoteValidityDays: (v: string) => void;
  rib: string;
  setRib: (v: string) => void;
  showRibOnQuote: boolean;
  setShowRibOnQuote: (v: boolean) => void;
}

export function QuoteCard({
  quoteValidityDays,
  setQuoteValidityDays,
  rib,
  setRib,
  showRibOnQuote,
  setShowRibOnQuote,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Devis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Validité des devis (jours)">
          <Input
            value={quoteValidityDays}
            onChange={(e) => setQuoteValidityDays(e.target.value)}
            type="number"
            min={1}
            placeholder="30"
          />
        </Field>
        <Field label="RIB / IBAN">
          <Input
            value={rib}
            onChange={(e) => setRib(e.target.value)}
            placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
          />
        </Field>
        <div className="flex items-center gap-3">
          <Switch
            checked={showRibOnQuote}
            onCheckedChange={setShowRibOnQuote}
          />
          <span className="text-sm">Afficher le RIB sur les devis</span>
        </div>
      </CardContent>
    </Card>
  );
}
