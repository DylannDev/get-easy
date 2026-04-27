import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { OptionsContent } from "@/components/admin/options/options-content";
import { getContainer } from "@/composition-root/container";
import { getActiveAgency } from "@/lib/admin/get-active-agency";

export default async function OptionsPage() {
  const agencyId = await getActiveAgency();
  const { listOptionsUseCase } = getContainer();
  const options = await listOptionsUseCase.execute(agencyId);

  return (
    <>
      <AdminHeader>
        <span className="text-sm text-muted-foreground">Options</span>
      </AdminHeader>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        <PageHeader
          title="Options"
          description={`${options.length} option${options.length > 1 ? "s" : ""}`}
        />
        <OptionsContent options={options} />
      </div>
    </>
  );
}
