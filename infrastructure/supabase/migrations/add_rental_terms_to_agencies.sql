-- Phase 6C — Éditeur des conditions générales de location par agence
-- Stocké au format Tiptap (JSON) pour permettre un rendu fidèle côté public.

ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS rental_terms JSONB,
  ADD COLUMN IF NOT EXISTS rental_terms_updated_at TIMESTAMP WITH TIME ZONE;
