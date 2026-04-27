"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/ui/phone-input";
import { Field } from "./field";

interface Props {
  smsEnabled: boolean;
  setSmsEnabled: (v: boolean) => void;
  smsAdminPhone: string;
  setSmsAdminPhone: (v: string) => void;
}

export function SmsCard({
  smsEnabled,
  setSmsEnabled,
  smsAdminPhone,
  setSmsAdminPhone,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notifications SMS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
          <span className="text-sm">
            Recevoir un SMS à chaque réservation payée
          </span>
        </div>
        {smsEnabled && (
          <Field label="Numéro de téléphone de l'admin">
            <PhoneInput
              value={smsAdminPhone}
              onChange={(v) => setSmsAdminPhone(v ?? "")}
              placeholder="6 94 03 06 70"
            />
          </Field>
        )}
      </CardContent>
    </Card>
  );
}
