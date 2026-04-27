import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/admin/page-header";
import { BackLink } from "@/components/admin/shared/back-link";
import { CustomerEditForm } from "@/components/admin/clients/customer-edit-form";
import { getContainer } from "@/composition-root/container";

interface Props {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerEditPage({ params }: Props) {
  const { customerId } = await params;
  const { customerRepository } = getContainer();
  const customer = await customerRepository.findById(customerId);
  if (!customer) notFound();

  return (
    <>
      <AdminHeader>
        <BackLink
          href={`/admin/clients/${customerId}`}
          label="Fiche client"
        />
      </AdminHeader>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        <PageHeader
          title={`Modifier ${customer.firstName} ${customer.lastName}`}
          description="Mettez à jour les informations du client."
        />
        <CustomerEditForm customer={customer} />
      </div>
    </>
  );
}
