"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { ContentOverlay } from "./shared/content-overlay";
import { switchAgency } from "@/actions/admin/switch-agency";

interface AgencyInfo {
  id: string;
  name: string;
  city: string;
}

interface Props {
  email: string;
  firstName: string | null;
  lastName: string | null;
  agencies: AgencyInfo[];
  activeAgencyId: string;
}

export function AdminSidebarWrapper({
  email,
  firstName,
  lastName,
  agencies,
  activeAgencyId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAgencyChange = async (agencyId: string) => {
    if (agencyId === activeAgencyId) return;
    await switchAgency(agencyId);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      {isPending && <ContentOverlay />}
      <AppSidebar
        email={email}
        firstName={firstName}
        lastName={lastName}
        agencies={agencies}
        currentAgencyId={activeAgencyId}
        onAgencyChange={handleAgencyChange}
      />
    </>
  );
}
