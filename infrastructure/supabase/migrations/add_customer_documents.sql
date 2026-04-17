-- Phase 7C — Pièces jointes client uploadées depuis le site public.
--
-- Le client peut importer (facultativement) son permis, sa pièce d'identité
-- et un justificatif de domicile au moment de la réservation, avant
-- paiement. Chaque client n'a qu'UN fichier par type — un nouvel upload
-- remplace l'ancien.
--
-- Le bucket Supabase Storage associé doit être créé manuellement :
--   bucket `customer-documents` — privé, accès via signed URL (1 h).
--   Arborescence :
--     customer-documents/
--     ├── staging/{uuid}.{ext}                -- temporaire (upload avant
--     │                                         création du customer)
--     └── {orgId}/{customerId}/{type}-{ts}.{ext}

CREATE TABLE IF NOT EXISTS customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('driver_license', 'id_card', 'proof_of_address')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_documents_customer
  ON customer_documents(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_documents_booking
  ON customer_documents(booking_id);
-- Garantit qu'un client n'a qu'un seul fichier par type en BDD
-- (remplacement à chaque nouvel upload côté application).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_customer_documents_customer_type
  ON customer_documents(customer_id, type);
