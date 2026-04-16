"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import {
  updateAgencyLegalDetails,
  uploadOrganizationLogo,
  removeOrganizationLogo,
  type LogoVariant,
} from "@/actions/admin/agency-details";
import type { Agency } from "@/domain/agency";

interface Props {
  agency: Agency;
}

export function OrganizationSettings({ agency }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingVariant, setUploadingVariant] = useState<LogoVariant | null>(
    null,
  );

  const [legalForm, setLegalForm] = useState(agency.legalForm ?? "");
  const [capitalSocial, setCapitalSocial] = useState(
    agency.capitalSocial ?? "",
  );
  const [rcsCity, setRcsCity] = useState(agency.rcsCity ?? "");
  const [rcsNumber, setRcsNumber] = useState(agency.rcsNumber ?? "");
  const [siret, setSiret] = useState(agency.siret ?? "");
  const [tvaIntracom, setTvaIntracom] = useState(agency.tvaIntracom ?? "");
  const [logoLight, setLogoLight] = useState<string | null>(
    agency.logoUrl ?? null,
  );
  const [logoDark, setLogoDark] = useState<string | null>(
    agency.logoDarkUrl ?? null,
  );
  const [vatEnabled, setVatEnabled] = useState(agency.vatEnabled ?? false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateAgencyLegalDetails(agency.id, {
      legalForm: legalForm || null,
      capitalSocial: capitalSocial || null,
      rcsCity: rcsCity || null,
      rcsNumber: rcsNumber || null,
      siret: siret || null,
      tvaIntracom: tvaIntracom || null,
      vatEnabled,
    });
    router.refresh();
    setSaving(false);
  };

  const handleLogoUpload = async (variant: LogoVariant, file: File) => {
    setUploadingVariant(variant);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadOrganizationLogo(agency.id, variant, fd);
      if (variant === "light") setLogoLight(result.url);
      else setLogoDark(result.url);
      router.refresh();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Erreur lors du téléversement",
      );
    } finally {
      setUploadingVariant(null);
    }
  };

  const handleLogoRemove = async (variant: LogoVariant) => {
    setUploadingVariant(variant);
    try {
      await removeOrganizationLogo(agency.id, variant);
      if (variant === "light") setLogoLight(null);
      else setLogoDark(null);
      router.refresh();
    } finally {
      setUploadingVariant(null);
    }
  };

  return (
    <>
      {saving && <ContentOverlay />}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Logos de l&apos;organisation
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 min-[1150px]:grid-cols-2">
            <LogoField
              label="Logo clair (pour fond sombre)"
              previewClass="bg-neutral-800"
              url={logoLight}
              uploading={uploadingVariant === "light"}
              onPick={(f) => handleLogoUpload("light", f)}
              onRemove={() => handleLogoRemove("light")}
            />
            <LogoField
              label="Logo foncé (pour fond clair)"
              previewClass="bg-white"
              url={logoDark}
              uploading={uploadingVariant === "dark"}
              onPick={(f) => handleLogoUpload("dark", f)}
              onRemove={() => handleLogoRemove("dark")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Informations légales (factures & contrats)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3 bg-gray-50">
              <div>
                <p className="text-sm font-medium">Assujetti à la TVA</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Si activé, les factures affichent le détail HT / TVA
                  (20 %) / TTC. Sinon, le total est indiqué net avec la
                  mention « TVA non applicable, art. 293 B du CGI ».
                </p>
              </div>
              <Switch
                checked={vatEnabled}
                onCheckedChange={setVatEnabled}
              />
            </div>

            <div className="grid gap-4 min-[1150px]:grid-cols-2">
              <Field label="Forme juridique">
                <Input
                  value={legalForm}
                  onChange={(e) => setLegalForm(e.target.value)}
                  placeholder="Ex : SARL"
                />
              </Field>
              <Field label="Capital social">
                <Input
                  value={capitalSocial}
                  onChange={(e) => setCapitalSocial(e.target.value)}
                  placeholder="Ex : 1 000,00 euros"
                />
              </Field>
            </div>
            <div className="grid gap-4 min-[1150px]:grid-cols-2">
              <Field label="RCS — Ville">
                <Input
                  value={rcsCity}
                  onChange={(e) => setRcsCity(e.target.value)}
                  placeholder="Ex : Paris"
                />
              </Field>
              <Field label="RCS — Numéro">
                <Input
                  value={rcsNumber}
                  onChange={(e) => setRcsNumber(e.target.value)}
                  placeholder="Ex : 123 456 789"
                />
              </Field>
            </div>
            <div className="grid gap-4 min-[1150px]:grid-cols-2">
              <Field label="SIRET">
                <Input
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  placeholder="Ex : 12345678900012"
                />
              </Field>
              <Field label="TVA Intracommunautaire">
                <Input
                  value={tvaIntracom}
                  onChange={(e) => setTvaIntracom(e.target.value)}
                  placeholder="Ex : FR00123456789"
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </>
  );
}

function LogoField({
  label,
  previewClass,
  url,
  uploading,
  onPick,
  onRemove,
}: {
  label: string;
  previewClass: string;
  url: string | null;
  uploading: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-4">
        <div
          className={`shrink-0 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden ${previewClass}`}
          style={{ width: 150, height: 100 }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Logo"
              className="max-w-full max-h-full object-contain p-2"
            />
          ) : (
            <span className="text-xs text-muted-foreground">Aucun</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label
            className={`text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors inline-block w-fit ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {uploading ? "Envoi…" : "Choisir un fichier"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPick(f);
                e.target.value = "";
              }}
            />
          </label>
          {url && (
            <button
              type="button"
              onClick={onRemove}
              disabled={uploading}
              className="text-xs text-red-500 hover:underline disabled:opacity-50 text-left"
            >
              Supprimer
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP ou SVG — max 2 Mo (converti en PNG).
          </p>
        </div>
      </div>
    </div>
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
