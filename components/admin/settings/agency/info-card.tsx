"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "./field";
import { CountrySelect } from "./country-select";

interface Props {
  name: string;
  setName: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
}

export function InfoCard({
  name,
  setName,
  address,
  setAddress,
  postalCode,
  setPostalCode,
  city,
  setCity,
  country,
  setCountry,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Informations de l&apos;agence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Nom de l'agence">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Get Easy"
            required
          />
        </Field>
        <Field label="Adresse">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="4 Lotissement Mortin"
            required
          />
        </Field>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Code postal">
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="97354"
            />
          </Field>
          <Field label="Localité">
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Rémire-Montjoly"
              required
            />
          </Field>
        </div>
        <Field label="Pays">
          <CountrySelect value={country} onChange={setCountry} />
        </Field>
      </CardContent>
    </Card>
  );
}
