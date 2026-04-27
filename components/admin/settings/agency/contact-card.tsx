"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "./field";

interface Props {
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
}

export function ContactCard({ phone, setPhone, email, setEmail }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Téléphone">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 94 03 06 70"
            required
          />
        </Field>
        <Field label="Email">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="contact@geteasylocation.com"
            required
          />
        </Field>
      </CardContent>
    </Card>
  );
}
