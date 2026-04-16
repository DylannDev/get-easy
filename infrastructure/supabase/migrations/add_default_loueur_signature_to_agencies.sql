-- Phase 6A.3 (complément) — Signature / tampon du Loueur par agence.
--
-- Stockée en data URL PNG (typiquement quelques dizaines de Ko). Reste
-- per-agency (pas de propagation aux siblings), car chaque agence peut
-- avoir son propre gérant qui signe différemment, ou son propre tampon.

ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS default_loueur_signature TEXT;
