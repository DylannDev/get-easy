import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebarWrapper } from "@/components/admin/admin-sidebar-wrapper";
import { getAdminSession } from "@/lib/admin/get-admin-session";
import { getActiveAgency } from "@/lib/admin/get-active-agency";
import { getContainer } from "@/composition-root/container";

export const metadata = {
  title: "Admin - Get Easy",
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const { agencyRepository } = getContainer();
  const agencies = await agencyRepository.findAll();
  const agencyInfos = agencies.map((a) => ({
    id: a.id,
    name: a.name,
    city: a.city,
  }));

  return (
    <SidebarProvider className="h-dvh">
      <AdminSidebarWrapper
        email={session.email}
        firstName={session.firstName}
        lastName={session.lastName}
        agencies={agencyInfos}
        activeAgencyId={await getActiveAgency()}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
