-- Phase 6A.2 — Numérotation des factures (FAC-YYYY-NNN) par organisation,
-- assujettissement TVA par organisation, et colonne invoice_number sur
-- documents.

-- 1. Assujettissement TVA — org-level, matérialisé sur chaque agence comme
--    les autres champs légaux.
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS vat_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Numéro de facture attribué (null pour les documents non-facture).
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS invoice_number TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_invoice_number
  ON documents(invoice_number)
  WHERE invoice_number IS NOT NULL;

-- 3. Compteur de factures par (organisation, année) — incrément atomique.
CREATE TABLE IF NOT EXISTS invoice_sequences (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INT NOT NULL,
  current_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, year)
);

-- 4. Fonction qui incrémente et retourne le prochain numéro.
--    Utilise INSERT ... ON CONFLICT DO UPDATE pour rester atomique sous
--    contention (deux webhooks qui arrivent en parallèle).
CREATE OR REPLACE FUNCTION next_invoice_number(
  p_organization_id UUID,
  p_year INT
) RETURNS INT AS $$
DECLARE
  v_next INT;
BEGIN
  INSERT INTO invoice_sequences (organization_id, year, current_number)
  VALUES (p_organization_id, p_year, 1)
  ON CONFLICT (organization_id, year)
  DO UPDATE SET
    current_number = invoice_sequences.current_number + 1,
    updated_at = NOW()
  RETURNING current_number INTO v_next;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;
