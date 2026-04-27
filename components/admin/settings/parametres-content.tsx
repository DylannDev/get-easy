"use client";

import { useState } from "react";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { AgencySettings } from "./agency-settings";
import { RentalTermsSettings } from "./rental-terms-settings";
import { useAgencyCrud } from "./parametres/use-agency-crud";
import { AgencySelector } from "./parametres/agency-selector";
import { AgencyTabs, type AgencyTab } from "./parametres/agency-tabs";
import { CreateAgencyDialog } from "./parametres/create-agency-dialog";
import { DeleteAgencyDialog } from "./parametres/delete-agency-dialog";
import type { Agency, RichTextDocument } from "@/domain/agency";

interface Props {
  agencies: Agency[];
  defaultRentalTerms: RichTextDocument;
}

/** Page Paramètres : sélecteur d'agence multi-agences + 2 onglets (Général /
 *  Conditions de location) délégant aux composants spécialisés
 *  `<AgencySettings />` et `<RentalTermsSettings />`. */
export function ParametresContent({ agencies, defaultRentalTerms }: Props) {
  const [selectedAgencyId, setSelectedAgencyId] = useState(
    agencies[0]?.id ?? "",
  );
  const [tab, setTab] = useState<AgencyTab>("general");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const selectedAgency = agencies.find((a) => a.id === selectedAgencyId);
  const isFirstAgency =
    agencies.length > 0 && selectedAgencyId === agencies[0].id;

  const crud = useAgencyCrud({
    initialAgencyId: selectedAgencyId,
    onAfterDelete: setSelectedAgencyId,
    fallbackAgencyId: agencies[0]?.id ?? "",
  });

  const handleCreate = async () => {
    await crud.create();
    setCreateOpen(false);
  };

  const handleDelete = async () => {
    setDeleteOpen(false);
    await crud.remove();
  };

  return (
    <>
      {crud.saving && <ContentOverlay />}

      <div className="flex-1 min-h-0 flex flex-col gap-6">
        <AgencySelector
          agencies={agencies}
          selectedAgencyId={selectedAgencyId}
          onSelect={setSelectedAgencyId}
          onDelete={() => setDeleteOpen(true)}
          isFirstAgency={isFirstAgency}
        />

        {selectedAgency && (
          <>
            <AgencyTabs tab={tab} onChange={setTab} />

            {tab === "general" && (
              <div className="flex-1 min-h-0 overflow-y-auto">
                <AgencySettings
                  key={selectedAgency.id}
                  agency={selectedAgency}
                  onOpenCreateDialog={() => setCreateOpen(true)}
                />
              </div>
            )}
            {tab === "terms" && (
              <RentalTermsSettings
                key={selectedAgency.id}
                agency={selectedAgency}
                defaultRentalTerms={defaultRentalTerms}
              />
            )}
          </>
        )}
      </div>

      <CreateAgencyDialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) crud.resetDraft();
          setCreateOpen(open);
        }}
        saving={crud.saving}
        draft={crud.draft}
        onUpdate={crud.updateDraft}
        isValid={crud.isDraftValid}
        onSubmit={handleCreate}
      />

      <DeleteAgencyDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        agencyName={selectedAgency?.name}
        onConfirm={handleDelete}
      />
    </>
  );
}
