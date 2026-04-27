"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./field";

interface Props {
  deliveryLabel: string;
  setDeliveryLabel: (v: string) => void;
  deliveryZones: string;
  setDeliveryZones: (v: string) => void;
}

export function DeliveryCard({
  deliveryLabel,
  setDeliveryLabel,
  deliveryZones,
  setDeliveryZones,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Livraison (optionnel)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Laissez vide pour ne pas afficher la section livraison sur le site.
        </p>
        <Field label="Intitulé">
          <Input
            value={deliveryLabel}
            onChange={(e) => setDeliveryLabel(e.target.value)}
            placeholder="Livraison gratuite"
          />
        </Field>
        <Field label="Zones de livraison">
          <Textarea
            value={deliveryZones}
            onChange={(e) => setDeliveryZones(e.target.value)}
            placeholder="Cayenne, Rémire-Montjoly, Matoury et Aéroport"
            rows={3}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
