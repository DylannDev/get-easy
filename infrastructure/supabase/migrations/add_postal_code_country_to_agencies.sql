-- Phase 6A.2 (complément) — Coordonnées postales complètes sur agencies,
-- utilisées dans les factures et contrats de location.

ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;
