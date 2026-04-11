"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/**
 * Renders a loading overlay that covers the SidebarInset (main content area),
 * not the full viewport. Uses a portal to attach to the sidebar-inset element.
 */
export function ContentOverlay() {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(
      '[data-slot="sidebar-inset"]'
    );
    if (el) {
      el.style.position = "relative";
      setContainer(el);
    }
  }, []);

  if (!container) return null;

  return createPortal(
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <LoadingSpinner />
    </div>,
    container
  );
}
