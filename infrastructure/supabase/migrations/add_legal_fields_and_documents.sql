-- Phase 6A.1 — Socle documents + champs légaux agence + puissance véhicule
--
-- 1. Nouveaux champs sur agencies : informations légales requises sur
--    les factures et contrats de location.
-- 2. Champ puissance fiscale (chevaux) sur vehicles.
-- 3. Table documents : références aux fichiers stockés dans le bucket privé
--    Storage `documents` (factures, contrats, autres).

ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS legal_form TEXT,
  ADD COLUMN IF NOT EXISTS capital_social TEXT,
  ADD COLUMN IF NOT EXISTS rcs_city TEXT,
  ADD COLUMN IF NOT EXISTS rcs_number TEXT,
  ADD COLUMN IF NOT EXISTS siret TEXT,
  ADD COLUMN IF NOT EXISTS tva_intracom TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS fiscal_power INT;

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('invoice', 'contract', 'other')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_agency ON documents(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_booking ON documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- Storage buckets à créer manuellement dans le dashboard Supabase
-- (l'API Supabase CLI n'est pas nécessairement disponible ici) :
--
--   • documents        — privé (aucun accès public), accédé via signed URL.
--   • organization-logos — public (en lecture) pour l'affichage du logo dans
--                          les factures/contrats ; l'upload reste admin-only.
--
-- NB : les logos sont rangés dans `organization-logos` par `organizationId/`
--      et réutilisables par toutes les agences d'une même organisation.
