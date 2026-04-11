import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { ParametresContent } from "@/components/admin/settings/parametres-content";
import { getContainer } from "@/composition-root/container";

export default async function ParametresPage() {
  const { agencyRepository } = getContainer();
  const agencies = await agencyRepository.findAll();

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Infos agence</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Infos agence"
          description="Gérez les informations de vos agences"
        />
        <ParametresContent agencies={agencies} />
      </div>
    </>
  );
}
