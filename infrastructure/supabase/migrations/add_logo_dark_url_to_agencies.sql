-- Phase 6A.1 (complément) — Ajout d'une seconde version du logo.
-- `logo_url`       : logo principal (version claire).
-- `logo_dark_url`  : version alternative (fond foncé).

ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS logo_dark_url TEXT;
