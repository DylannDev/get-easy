"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getLastSeenTimestamp } from "@/hooks/use-last-seen-bookings";
import { getNewBookingsCount } from "@/actions/admin/new-bookings-count";
import Link from "next/link";
import {
  PiCalendarCheck,
  PiCalendarBlank,
  PiUsers,
  PiCar,
  PiProhibit,
  PiChartBar,
  PiTag,
  PiSignOut,
  PiBuildings,
  PiCheck,
  PiCaretUpDown,
  PiFileText,
  PiBriefcase,
} from "react-icons/pi";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { signOut } from "@/actions/admin/auth";

const mainNav = [
  { label: "Réservations", href: "/admin/reservations", icon: PiCalendarCheck },
  { label: "Planning", href: "/admin/planning", icon: PiCalendarBlank },
];

const managementNav = [
  { label: "Clients", href: "/admin/clients", icon: PiUsers },
  { label: "Véhicules", href: "/admin/vehicules", icon: PiCar },
  {
    label: "Indisponibilités",
    href: "/admin/indisponibilites",
    icon: PiProhibit,
  },
  { label: "Options", href: "/admin/options", icon: PiTag },
  { label: "Documents", href: "/admin/documents", icon: PiFileText },
];

const otherNav = [
  { label: "Statistiques", href: "/admin/statistiques", icon: PiChartBar },
  { label: "Infos agence", href: "/admin/infos-agence", icon: PiBuildings },
  {
    label: "Infos organisation",
    href: "/admin/infos-organisation",
    icon: PiBriefcase,
  },
];

interface AgencyInfo {
  id: string;
  name: string;
  city: string;
}

interface AppSidebarProps {
  email: string;
  agencies?: AgencyInfo[];
  currentAgencyId?: string;
  onAgencyChange?: (agencyId: string) => void;
}

export function AppSidebar({
  email,
  agencies = [],
  currentAgencyId,
  onAgencyChange,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  // Sur mobile, ferme le drawer dès qu'on clique un lien (sinon il reste ouvert
  // et masque le contenu après navigation).
  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (href: string) => pathname.startsWith(href);

  const [newBookingsCount, setNewBookingsCount] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Charge le nombre de nouvelles résas au mount et quand le pathname change.
  useEffect(() => {
    const lastSeen = getLastSeenTimestamp();
    getNewBookingsCount(lastSeen).then(setNewBookingsCount);
  }, [pathname]);
  const currentAgency = agencies.find((a) => a.id === currentAgencyId) ?? agencies[0];
  const showAgencySwitcher = agencies.length > 1;

  const renderNavItems = (
    items: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[]
  ) => (
    <SidebarMenu>
      {items.map((item) => {
        const badge =
          item.href === "/admin/reservations" && newBookingsCount > 0
            ? newBookingsCount
            : 0;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isActive(item.href)}>
              <Link href={item.href} onClick={handleNavClick}>
                <item.icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center size-5 rounded-full bg-green text-black text-[10px] font-bold">
                    {badge}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/admin" className="py-8" onClick={handleNavClick}>
          <img src="/logo-white.svg" alt="Get Easy" className="h-8 w-auto" />
        </Link>

        {/* Agency switcher */}
        {showAgencySwitcher && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors">
                <PiBuildings className="size-4 shrink-0" />
                <span className="flex-1 text-left truncate">
                  {currentAgency
                    ? `${currentAgency.name} · ${currentAgency.city}`
                    : "Agence"}
                </span>
                <PiCaretUpDown className="size-3.5 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="start" side="right">
              {agencies.map((agency) => (
                <button
                  key={agency.id}
                  onClick={() => {
                    setPopoverOpen(false);
                    if (isMobile) setOpenMobile(false);
                    onAgencyChange?.(agency.id);
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-green/50 cursor-pointer"
                >
                  <div className="size-4 flex items-center justify-center">
                    {agency.id === currentAgencyId && (
                      <PiCheck className="size-4" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{agency.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {agency.city}
                    </div>
                  </div>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>{renderNavItems(mainNav)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderNavItems(managementNav)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Autres</SidebarGroupLabel>
          <SidebarGroupContent>{renderNavItems(otherNav)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
            {email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Déconnexion"
            >
              <PiSignOut className="size-4" />
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
