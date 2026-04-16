import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { ParametresContent } from "@/components/admin/settings/parametres-content";
import { getContainer } from "@/composition-root/container";
import { getDefaultRentalTerms } from "@/lib/admin/default-rental-terms";

export default async function ParametresPage() {
  const { agencyRepository } = getContainer();
  const [agencies, defaultRentalTerms] = await Promise.all([
    agencyRepository.findAll(),
    getDefaultRentalTerms(),
  ]);

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Infos agence</span>
      </AdminHeader>
      <div className="flex-1 min-h-0 flex flex-col space-y-6 p-6">
        <PageHeader
          title="Infos agence"
          description="Gérez les informations de vos agences"
        />
        <ParametresContent
          agencies={agencies}
          defaultRentalTerms={defaultRentalTerms}
        />
      </div>
    </>
  );
}
