"use client";

import { Button } from "@/components/ui/button";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import type { Agency } from "@/domain/agency";
import { useLogoUpload } from "./organization/use-logo-upload";
import { useLegalForm } from "./organization/use-legal-form";
import { LogosCard } from "./organization/logos-card";
import { LegalInfoCard } from "./organization/legal-info-card";

interface Props {
  agency: Agency;
}

/** Container des paramètres organisation (logos + infos légales). Délègue
 *  aux 2 hooks `useLogoUpload` et `useLegalForm` puis compose les 2 cards. */
export function OrganizationSettings({ agency }: Props) {
  const upload = useLogoUpload({
    agencyId: agency.id,
    initialLight: agency.logoUrl ?? null,
    initialDark: agency.logoDarkUrl ?? null,
  });
  const form = useLegalForm(agency);

  return (
    <>
      {form.saving && <ContentOverlay />}
      <form onSubmit={form.submit} className="space-y-6">
        <LogosCard upload={upload} />
        <LegalInfoCard form={form} />

        <div className="flex sm:justify-end">
          <Button
            type="submit"
            size="sm"
            className="w-full sm:w-auto"
            disabled={form.saving}
          >
            {form.saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </>
  );
}
