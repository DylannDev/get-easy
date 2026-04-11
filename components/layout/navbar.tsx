/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { ContactDialog } from "./contact-dialog";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { useAgencyStore } from "@/stores/agency-store";

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  hours: string;
  deliveryLabel: string;
  deliveryZones: string;
}

interface NavbarProps {
  contactInfo?: ContactInfo;
  allContacts?: Record<string, ContactInfo>;
  defaultAgencyId?: string;
}

export const Navbar = ({
  contactInfo,
  allContacts,
  defaultAgencyId,
}: NavbarProps) => {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const { setAgencyContacts, setActiveAgencyId, activeAgencyId, agencyContacts } =
    useAgencyStore();

  // Initialize store with server data
  useEffect(() => {
    if (allContacts) {
      setAgencyContacts(allContacts);
    }
    if (defaultAgencyId && !activeAgencyId) {
      setActiveAgencyId(defaultAgencyId);
    }
  }, [allContacts, defaultAgencyId, setAgencyContacts, setActiveAgencyId, activeAgencyId]);

  // Use active agency contact or fallback
  const activeContact =
    (activeAgencyId && agencyContacts[activeAgencyId]) || contactInfo;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-white/80 backdrop-blur-sm",
        !isHomePage && "border-b border-gray-300 bg-white"
      )}
    >
      <div className="flex items-center justify-between py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Logo />

        <ContactDialog contactInfo={activeContact}>
          <div>
            <Button className="hidden sm:flex" type="button">
              Infos Agence
            </Button>
            <div className="p-1.5 bg-black rounded-sm flex sm:hidden">
              <Menu className="text-green" strokeWidth={1.75} />
            </div>
          </div>
        </ContactDialog>
      </div>
    </header>
  );
};
