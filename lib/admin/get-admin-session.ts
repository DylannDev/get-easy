import { createAuthServerClient } from "@/infrastructure/supabase/auth";
import { createAdminClient } from "@/infrastructure/supabase/client";

export interface AdminSession {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Reads the Supabase auth session and verifies the user has an
 * admin_profiles row. Returns null if not authenticated or not admin.
 */
export const getAdminSession = async (): Promise<AdminSession | null> => {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("admin_profiles")
    .select("organization_id, role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    organizationId: profile.organization_id,
    role: profile.role,
    firstName: profile.first_name ?? null,
    lastName: profile.last_name ?? null,
  };
};
