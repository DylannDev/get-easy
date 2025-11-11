"use client";

import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        !isHomePage && "border-b border-gray-300 bg-white"
      )}
    >
      <div className="flex items-center justify-between py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Logo />
        <Button type="button">Se connecter</Button>
      </div>
    </header>
  );
};
