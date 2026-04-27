-- =============================================================================
-- Add first_name + last_name to admin_profiles
-- =============================================================================
--
-- Why:
--   On évite de stocker le display name dans `auth.users.raw_user_meta_data`
--   pour respecter la clean architecture : les infos métier admin doivent
--   vivre dans `admin_profiles` (table applicative) plutôt que dans
--   `auth.users` (Supabase Auth, géré par Supabase).
--
--   Bénéfices :
--   - Accessible via les repositories sans toucher à l'API Auth
--   - Permet d'ajouter d'autres champs métier (avatar, téléphone…) plus tard
--   - L'avatar de la sidebar peut afficher l'initiale du prénom
--
-- Idempotent : safe à re-runner.
-- =============================================================================

ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name  TEXT;

COMMENT ON COLUMN public.admin_profiles.first_name IS
  'Prénom de l''admin — utilisé pour le display name + avatar de la sidebar.';
COMMENT ON COLUMN public.admin_profiles.last_name IS
  'Nom de famille de l''admin — utilisé pour le display name dans les UI admin.';
