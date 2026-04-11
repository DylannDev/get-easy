"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PiArrowLeft } from "react-icons/pi";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface BackLinkProps {
  href: string;
  label: string;
}

export function BackLink({ href, label }: BackLinkProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    router.push(href);
  };

  if (loading) {
    return <LoadingSpinner size="sm" />;
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      <PiArrowLeft className="size-4" />
      {label}
    </button>
  );
}
