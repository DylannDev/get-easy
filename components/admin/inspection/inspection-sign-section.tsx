"use client";

import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/components/admin/contracts/signature-pad";
import { PiPencilSimple } from "react-icons/pi";

interface Props {
  signature: string | null;
  setSignature: (v: string | null) => void;
  totalPhotos: number;
  loading: boolean;
  onSaveDraft: () => void;
  onSign: () => void;
}

/** Pied de section : signature client + boutons "Sauvegarder brouillon" /
 *  "Finaliser et signer". Désactive le bouton final si pas de signature ou
 *  pas de photo et explique pourquoi. */
export function InspectionSignSection({
  signature,
  setSignature,
  totalPhotos,
  loading,
  onSaveDraft,
  onSign,
}: Props) {
  return (
    <div className="space-y-4 border-t pt-6">
      <SignaturePad
        label="Signature du client"
        initialValue={signature}
        onChange={setSignature}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onSaveDraft}
          disabled={loading}
        >
          Sauvegarder le brouillon
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="w-full sm:w-auto"
          disabled={loading || !signature || totalPhotos === 0}
          onClick={onSign}
        >
          <PiPencilSimple className="size-4" />
          Finaliser et signer
        </Button>
      </div>
      {!signature && totalPhotos > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Le client doit signer avant de finaliser.
        </p>
      )}
      {totalPhotos === 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Ajoutez au moins une photo pour pouvoir finaliser.
        </p>
      )}
    </div>
  );
}
