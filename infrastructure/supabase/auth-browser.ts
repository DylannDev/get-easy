import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client for auth operations (login, logout).
 * Separated from auth.ts to avoid importing next/headers in client components.
 */
export const createAuthBrowserClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
