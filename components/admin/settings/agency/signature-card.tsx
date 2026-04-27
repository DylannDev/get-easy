"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoueurSignatureField } from "../loueur-signature-field";

interface Props {
  agencyId: string;
  defaultSignature: string | null;
}

export function SignatureCard({ agencyId, defaultSignature }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Signature / tampon du Loueur</CardTitle>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Utilisée par défaut dans les contrats de location de cette agence.{" "}
          <br />
          Propre à chaque agence : modifiable agence par agence.
        </p>
      </CardHeader>
      <CardContent>
        <LoueurSignatureField agencyId={agencyId} value={defaultSignature} />
      </CardContent>
    </Card>
  );
}
