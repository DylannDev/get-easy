/* eslint-disable react/no-unescaped-entities */
"use client";

import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { ContactDialog } from "./contact-dialog";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-white/80 backdrop-blur-sm",
        !isHomePage && "border-b border-gray-300 bg-white"
      )}
    >
      <div className="flex items-center justify-between py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Logo />

        <ContactDialog>
          <div>
            <Button className="hidden sm:flex" type="button">
              Contacter l'agence
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
