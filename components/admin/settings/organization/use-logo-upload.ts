"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  uploadOrganizationLogo,
  removeOrganizationLogo,
  type LogoVariant,
} from "@/actions/admin/agency-details";

interface Args {
  agencyId: string;
  initialLight: string | null;
  initialDark: string | null;
}

/** Encapsule l'upload/suppression des 2 variantes de logo de l'organisation
 *  (clair pour fond sombre, foncé pour fond clair) avec un état partagé
 *  `uploadingVariant` pour désactiver les boutons pendant la requête. */
export function useLogoUpload({ agencyId, initialLight, initialDark }: Args) {
  const router = useRouter();
  const [uploadingVariant, setUploadingVariant] = useState<LogoVariant | null>(
    null,
  );
  const [logoLight, setLogoLight] = useState<string | null>(initialLight);
  const [logoDark, setLogoDark] = useState<string | null>(initialDark);

  const handleUpload = async (variant: LogoVariant, file: File) => {
    setUploadingVariant(variant);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadOrganizationLogo(agencyId, variant, fd);
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

  const handleRemove = async (variant: LogoVariant) => {
    setUploadingVariant(variant);
    try {
      await removeOrganizationLogo(agencyId, variant);
      if (variant === "light") setLogoLight(null);
      else setLogoDark(null);
      router.refresh();
    } finally {
      setUploadingVariant(null);
    }
  };

  return {
    uploadingVariant,
    logoLight,
    logoDark,
    handleUpload,
    handleRemove,
  };
}
