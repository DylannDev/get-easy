"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { RichTextEditor } from "@/components/admin/shared/rich-text-editor";
import { updateAgencyRentalTerms } from "@/actions/admin/agency-terms";
import { formatDateCayenne } from "@/lib/format-date";
import { PiArrowCounterClockwise } from "react-icons/pi";
import type { Agency, RichTextDocument } from "@/domain/agency";

interface Props {
  agency: Agency;
  defaultRentalTerms: RichTextDocument;
}

export function RentalTermsSettings({ agency, defaultRentalTerms }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [value, setValue] = useState<RichTextDocument | null>(
    agency.rentalTerms ?? defaultRentalTerms
  );

  const handleSave = async () => {
    setSaving(true);
    await updateAgencyRentalTerms(agency.id, value);
    setSaving(false);
    router.refresh();
  };

  const handleReset = () => {
    // Deep-clone so later edits in the editor don't mutate the shared default.
    setValue(JSON.parse(JSON.stringify(defaultRentalTerms)));
    setResetDialogOpen(false);
  };

  return (
    <>
      {saving && <ContentOverlay />}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Conditions générales de location</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Ce texte est affiché aux clients lors de la réservation. Il
                doit être validé avant paiement.
              </p>
            </div>
            {agency.rentalTermsUpdatedAt && (
              <p className="text-xs text-muted-foreground shrink-0">
                Mis à jour le{" "}
                {formatDateCayenne(
                  agency.rentalTermsUpdatedAt,
                  "dd MMM yyyy 'à' HH:mm"
                )}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
          <RichTextEditor
            value={value}
            onChange={setValue}
            placeholder="Rédigez les conditions de location…"
          />
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              disabled={saving}
            >
              <PiArrowCounterClockwise className="size-4" />
              Réinitialiser aux conditions par défaut
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Réinitialiser les conditions de location ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le contenu actuel sera remplacé par les conditions par défaut.
              Cette action ne devient définitive qu&apos;après avoir cliqué sur
              &laquo;&nbsp;Enregistrer&nbsp;&raquo;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black text-black hover:text-green bg-transparent shadow-none">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
