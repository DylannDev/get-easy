"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { saveContractForBooking } from "@/actions/admin/documents";
import type { ContractEditableFields } from "@/domain/contract";
import { PiCheck, PiLock } from "react-icons/pi";
import Link from "next/link";
import { SignaturePad } from "./signature-pad";

interface AgencyReadOnly {
  name: string;
  legalForm: string | null;
  capitalSocial: string | null;
  address: string;
  postalCode: string | null;
  city: string;
  country: string | null;
  rcsCity: string | null;
  rcsNumber: string | null;
  siret: string | null;
  phone: string | null;
  email: string | null;
}

interface Props {
  bookingId: string;
  agency: AgencyReadOnly;
  initialFields: ContractEditableFields;
  initialSignatures: {
    customer: string | null;
    loueur: string | null;
  };
  signedAt: string | null;
}

export function ContractEditor({
  bookingId,
  agency,
  initialFields,
  initialSignatures,
  signedAt,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fields, setFields] = useState<ContractEditableFields>(initialFields);
  const [customerSignature, setCustomerSignature] = useState<string | null>(
    initialSignatures.customer,
  );
  // La signature du loueur est figée à celle configurée dans Infos agence.
  // Pas de canvas ici : on l'affiche en lecture seule. Modifiable uniquement
  // depuis Infos agence.
  const loueurSignature = initialSignatures.loueur;
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const update =
    <K extends keyof ContractEditableFields>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveContractForBooking(bookingId, {
        fields: fields as Record<string, string | undefined>,
        customerSignature,
        loueurSignature,
      });
      if (!result.ok) {
        setError(result.error ?? "Erreur lors de l'enregistrement.");
        return;
      }
      setSavedAt(new Date());
      // Retour à la fiche réservation une fois l'enregistrement confirmé.
      router.push(`/admin/reservations/${bookingId}`);
      router.refresh();
    });
  };

  const agencyAddress = [
    agency.address,
    [agency.postalCode, agency.city].filter(Boolean).join(" "),
    agency.country,
  ]
    .filter(Boolean)
    .join(", ");
  const rcsFmt =
    agency.rcsCity && agency.rcsNumber
      ? `${agency.rcsCity} ${agency.rcsNumber}`
      : "";

  return (
    <>
      {pending && <ContentOverlay />}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Loueur — lecture seule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PiLock className="size-4 text-muted-foreground" />
              Loueur (modifiable dans Infos organisation)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 min-[1150px]:grid-cols-2">
              <ReadOnlyField label="Dénomination" value={agency.name} />
              <ReadOnlyField
                label="Forme juridique"
                value={agency.legalForm ?? ""}
              />
              <ReadOnlyField
                label="Capital social"
                value={agency.capitalSocial ?? ""}
              />
              <ReadOnlyField label="Adresse" value={agencyAddress} />
              <ReadOnlyField label="RCS" value={rcsFmt} />
              <ReadOnlyField label="SIRET" value={agency.siret ?? ""} />
              <ReadOnlyField label="Téléphone" value={agency.phone ?? ""} />
              <ReadOnlyField label="Email" value={agency.email ?? ""} />
            </div>
          </CardContent>
        </Card>

        {/* Locataire */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Locataire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 min-[1150px]:grid-cols-2">
              <Field label="Prénom">
                <Input
                  value={fields.customerFirstName ?? ""}
                  onChange={update("customerFirstName")}
                />
              </Field>
              <Field label="Nom">
                <Input
                  value={fields.customerLastName ?? ""}
                  onChange={update("customerLastName")}
                />
              </Field>
              <Field label="Date de naissance">
                <Input
                  value={fields.customerBirthDate ?? ""}
                  onChange={update("customerBirthDate")}
                />
              </Field>
              <Field label="Lieu de naissance">
                <Input
                  value={fields.customerBirthPlace ?? ""}
                  onChange={update("customerBirthPlace")}
                />
              </Field>
              <Field label="N° pièce d'identité">
                <Input
                  value={fields.customerIdNumber ?? ""}
                  onChange={update("customerIdNumber")}
                />
              </Field>
              <Field label="Pièce délivrée le">
                <Input
                  value={fields.customerIdIssuedAt ?? ""}
                  onChange={update("customerIdIssuedAt")}
                />
              </Field>
              <Field label="N° permis de conduire">
                <Input
                  value={fields.customerLicenseNumber ?? ""}
                  onChange={update("customerLicenseNumber")}
                />
              </Field>
              <Field label="Permis délivré le">
                <Input
                  value={fields.customerLicenseIssuedAt ?? ""}
                  onChange={update("customerLicenseIssuedAt")}
                />
              </Field>
              <Field label="Permis valable jusqu'au">
                <Input
                  value={fields.customerLicenseValidUntil ?? ""}
                  onChange={update("customerLicenseValidUntil")}
                />
              </Field>
              <Field label="Adresse">
                <Input
                  value={fields.customerAddress ?? ""}
                  onChange={update("customerAddress")}
                />
              </Field>
              <Field label="Code postal">
                <Input
                  value={fields.customerPostalCode ?? ""}
                  onChange={update("customerPostalCode")}
                />
              </Field>
              <Field label="Ville">
                <Input
                  value={fields.customerCity ?? ""}
                  onChange={update("customerCity")}
                />
              </Field>
              <Field label="Pays">
                <Input
                  value={fields.customerCountry ?? ""}
                  onChange={update("customerCountry")}
                />
              </Field>
              <Field label="Téléphone">
                <Input
                  value={fields.customerPhone ?? ""}
                  onChange={update("customerPhone")}
                />
              </Field>
              <Field label="Email">
                <Input
                  value={fields.customerEmail ?? ""}
                  onChange={update("customerEmail")}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Véhicule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Véhicule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 min-[1150px]:grid-cols-2">
              <Field label="Marque">
                <Input
                  value={fields.vehicleBrand ?? ""}
                  onChange={update("vehicleBrand")}
                />
              </Field>
              <Field label="Modèle">
                <Input
                  value={fields.vehicleModel ?? ""}
                  onChange={update("vehicleModel")}
                />
              </Field>
              <Field label="Puissance fiscale (CV)">
                <Input
                  value={fields.vehicleFiscalPower ?? ""}
                  onChange={update("vehicleFiscalPower")}
                />
              </Field>
              <Field label="Couleur">
                <Input
                  value={fields.vehicleColor ?? ""}
                  onChange={update("vehicleColor")}
                />
              </Field>
              <Field label="Immatriculation">
                <Input
                  value={fields.vehicleRegistrationPlate ?? ""}
                  onChange={update("vehicleRegistrationPlate")}
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-3 min-[1150px]:grid-cols-2 pt-4 border-t">
              <Field label="Kilométrage (départ)">
                <Input
                  value={fields.vehicleMileageStart ?? ""}
                  onChange={update("vehicleMileageStart")}
                  placeholder="Au moment de la remise"
                />
              </Field>
              <Field label="Kilométrage (retour)">
                <Input
                  value={fields.vehicleMileageEnd ?? ""}
                  onChange={update("vehicleMileageEnd")}
                  placeholder="Au moment de la restitution"
                />
              </Field>
              <Field label="Niveau carburant (départ)">
                <Input
                  value={fields.vehicleFuelStart ?? ""}
                  onChange={update("vehicleFuelStart")}
                  placeholder="Ex. 3/4, Plein…"
                />
              </Field>
              <Field label="Niveau carburant (retour)">
                <Input
                  value={fields.vehicleFuelEnd ?? ""}
                  onChange={update("vehicleFuelEnd")}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Durée & montants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Durée et montants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 min-[1150px]:grid-cols-2">
              <Field label="Durée totale">
                <Input
                  value={fields.durationLabel ?? ""}
                  onChange={update("durationLabel")}
                />
              </Field>
              <div />
              <Field label="Date & heure de départ">
                <Input
                  value={fields.rentalStart ?? ""}
                  onChange={update("rentalStart")}
                />
              </Field>
              <Field label="Date & heure de retour">
                <Input
                  value={fields.rentalEnd ?? ""}
                  onChange={update("rentalEnd")}
                />
              </Field>
              <Field label="Prix / jour">
                <Input
                  value={fields.pricePerDay ?? ""}
                  onChange={update("pricePerDay")}
                />
              </Field>
              <Field label="Total location">
                <Input
                  value={fields.priceTotal ?? ""}
                  onChange={update("priceTotal")}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Divers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Divers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 min-[1150px]:grid-cols-2">
              <Field label="Adresse de restitution">
                <Input
                  value={fields.returnAddress ?? ""}
                  onChange={update("returnAddress")}
                  placeholder="Par défaut : adresse de l'agence"
                />
              </Field>
              <Field label="Date & heure de restitution">
                <Input
                  value={fields.returnDatetime ?? ""}
                  onChange={update("returnDatetime")}
                />
              </Field>
              <Field label="Date du constat amiable">
                <Input
                  value={fields.constatDate ?? ""}
                  onChange={update("constatDate")}
                  placeholder="À remplir en cas d'incident"
                />
              </Field>
              <Field label="Fait à">
                <Input
                  value={fields.contractCity ?? ""}
                  onChange={update("contractCity")}
                />
              </Field>
              <Field label="Le">
                <Input
                  value={fields.contractDate ?? ""}
                  onChange={update("contractDate")}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Signatures */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Signatures</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Précédées de la mention « lu et approuvé ». Signez au doigt
                  sur tablette, au stylet ou au trackpad.
                </p>
              </div>
              {signedAt && customerSignature && loueurSignature ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium whitespace-nowrap">
                  <PiCheck className="size-4" />
                  Signé le{" "}
                  {new Date(signedAt).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 min-[1150px]:grid-cols-2">
              <SignaturePad
                label="Locataire"
                initialValue={initialSignatures.customer}
                onChange={setCustomerSignature}
              />
              <LoueurSignatureDisplay value={loueurSignature} />
            </div>
          </CardContent>
        </Card>

        {/* Action bar en flux normal, juste après la dernière card. */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="text-xs text-muted-foreground">
            {error ? (
              <span className="text-red-500">{error}</span>
            ) : savedAt ? (
              <span className="text-green-600">
                Enregistré à {savedAt.toLocaleTimeString("fr-FR")}
              </span>
            ) : null}
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer et générer le PDF"}
          </Button>
        </div>
      </form>
    </>
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm flex items-center text-muted-foreground">
        {value || "—"}
      </div>
    </div>
  );
}

function LoueurSignatureDisplay({ value }: { value: string | null }) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground">Loueur</span>
      {/*
       * Aligné sur les dimensions du canvas du Locataire (`SignaturePad`) :
       * `w-full max-h-[500px]`. L'image est `object-cover` pour remplir
       * intégralement la zone — recadrée si la signature n'est pas carrée.
       */}
      <div className="flex items-center justify-center w-full h-[400px] rounded-md border border-gray-200 bg-white overflow-hidden">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Signature / tampon du loueur"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center px-4">
            <p className="text-xs text-muted-foreground mb-2">
              Aucune signature/tampon configuré pour cette agence.
            </p>
            <Link
              href="/admin/infos-agence"
              className="text-xs text-black underline hover:no-underline"
            >
              Ajouter une signature dans Infos agence
            </Link>
          </div>
        )}
      </div>
      {value && (
        <Link
          href="/admin/infos-agence"
          className="text-xs text-muted-foreground underline hover:no-underline self-start inline-block"
        >
          Modifier dans Infos agence
        </Link>
      )}
    </div>
  );
}
