import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { OrganizationSettings } from "@/components/admin/settings/organization-settings";
import { getContainer } from "@/composition-root/container";

export default async function InfosOrganisationPage() {
  const { agencyRepository } = getContainer();
  const agencies = await agencyRepository.findAll();

  // Legal identity lives at organization level but is materialised on each
  // agency row, so we pick the first agency as a reference. The save action
  // propagates changes to all siblings of the same organization.
  const reference = agencies[0] ?? null;

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Infos organisation</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        <PageHeader
          title="Infos organisation"
          description="Informations légales et logos partagés entre toutes les agences"
        />
        {reference ? (
          <OrganizationSettings agency={reference} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune agence. Créez-en une depuis « Infos agence ».
          </p>
        )}
      </div>
    </>
  );
}
