"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PiArrowLeft } from "react-icons/pi";
import { Button } from "@/components/ui/button";
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
    <Button type="button" variant="default" size="xs" onClick={handleClick}>
      <PiArrowLeft className="size-4" />
      {label}
    </Button>
  );
}
