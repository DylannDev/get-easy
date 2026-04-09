import { createServerClient } from "@supabase/ssr";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * The auto-generated `Database` types are incomplete (missing several columns
 * such as `expires_at`). Until they are regenerated, repositories use this
 * loose alias to avoid spurious `never` types from `.from(...)`.
 *
 * TODO (Phase 5/6): regenerate types via `supabase gen types typescript` and
 * remove this alias.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LooseSupabaseClient = SupabaseClient<any, "public", any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const createClient = async () => {
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials!");
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

/**
 * Crée un client Supabase avec la clé service role pour les opérations administratives
 * À utiliser UNIQUEMENT côté serveur pour les opérations qui nécessitent un accès complet
 * (webhooks, tâches admin, etc.)
 */
export const createAdminClient = (): LooseSupabaseClient => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Missing Supabase admin credentials!");
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as unknown as LooseSupabaseClient;
};
