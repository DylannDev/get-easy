"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiCheck } from "react-icons/pi";
import { SignaturePad } from "../signature-pad";
import { LoueurSignatureDisplay } from "./loueur-signature-display";

interface Props {
  initialCustomerSignature: string | null;
  loueurSignature: string | null;
  onCustomerChange: (value: string | null) => void;
  signedAt: string | null;
}

/** Card "Signatures" : pad locataire + display loueur. Affiche un badge
 *  "Signé le …" quand les 2 parties ont signé. */
export function SignaturesCard({
  initialCustomerSignature,
  loueurSignature,
  onCustomerChange,
  signedAt,
}: Props) {
  const isSigned =
    !!signedAt && !!initialCustomerSignature && !!loueurSignature;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Signatures</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Précédées de la mention « lu et approuvé ». Signez au doigt sur
              tablette, au stylet ou au trackpad.
            </p>
          </div>
          {isSigned && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium whitespace-nowrap">
              <PiCheck className="size-4" />
              Signé le{" "}
              {new Date(signedAt).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 min-[1150px]:grid-cols-2">
          <SignaturePad
            label="Locataire"
            initialValue={initialCustomerSignature}
            onChange={onCustomerChange}
          />
          <LoueurSignatureDisplay value={loueurSignature} />
        </div>
      </CardContent>
    </Card>
  );
}
