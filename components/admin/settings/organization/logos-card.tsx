"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoField } from "./logo-field";
import type { useLogoUpload } from "./use-logo-upload";

interface Props {
  upload: ReturnType<typeof useLogoUpload>;
}

/** Card "Logos de l'organisation" : 2 variantes (clair pour fond sombre,
 *  foncé pour fond clair). Toute la logique d'upload est dans le hook. */
export function LogosCard({ upload }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Logos de l&apos;organisation
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <LogoField
          label="Logo clair (pour fond sombre)"
          previewClass="bg-neutral-800"
          url={upload.logoLight}
          uploading={upload.uploadingVariant === "light"}
          onPick={(f) => upload.handleUpload("light", f)}
          onRemove={() => upload.handleRemove("light")}
        />
        <LogoField
          label="Logo foncé (pour fond clair)"
          previewClass="bg-white"
          url={upload.logoDark}
          uploading={upload.uploadingVariant === "dark"}
          onPick={(f) => upload.handleUpload("dark", f)}
          onRemove={() => upload.handleRemove("dark")}
        />
      </CardContent>
    </Card>
  );
}
