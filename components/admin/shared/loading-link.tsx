"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContentOverlay } from "./content-overlay";

interface LoadingLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "href"> {
  href: string;
}

/**
 * Drop-in replacement de `<Link>` (next/link) qui affiche le `<ContentOverlay />`
 * pendant la transition de navigation. Utile pour les listes/tables où une
 * navigation peut prendre quelques centaines de ms (fetch côté serveur,
 * `loading.tsx` qui ne kick pas si la nav est rapide mais perceptible).
 *
 * Conserve le prefetch automatique de `<Link>`.
 */
export function LoadingLink({ href, onClick, ...props }: LoadingLinkProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      {pending && <ContentOverlay />}
      <Link
        href={href}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          // Cmd/Ctrl/middle-click → laisse le comportement natif (nouvel onglet).
          if (e.metaKey || e.ctrlKey || e.button === 1 || e.shiftKey) return;
          e.preventDefault();
          startTransition(() => router.push(href));
        }}
        {...props}
      />
    </>
  );
}

/**
 * Hook pour les cas non-Link (ex : `<TableRow onClick>`). Renvoie un
 * `navigate(href)` qui wrap `router.push` dans une transition + l'overlay
 * `pending` à afficher conditionnellement par le caller.
 */
export function useNavigateWithLoader() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const navigate = (href: string) => {
    startTransition(() => router.push(href));
  };

  return { pending, navigate };
}
