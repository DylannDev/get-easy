-- Phase 7D — Devis (Quote)
--
-- Un devis est un document pré-contractuel : mêmes données qu'une
-- réservation (véhicule, client, dates, options, CGL, total) mais
-- SANS créer de réservation. L'agence le télécharge en PDF et le
-- remet au prospect.
--
-- Numérotation : DEV-YYYY-NNN par organisation (comme FAC-* pour les
-- factures). Logique MAX+1 basée sur la colonne documents.quote_number
-- pour permettre la réutilisation d'un numéro après suppression.
--
-- Validité : configurable par agence (quote_validity_days), 30 jours
-- par défaut. Passée cette date, le devis est marqué "Expiré" dans
-- la liste (filtrage applicatif).

-- 1. Validité des devis : réglage agence.
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS quote_validity_days INT NOT NULL DEFAULT 30
    CHECK (quote_validity_days >= 1);

-- 2. Table principale `quotes` — miroir léger de `bookings`.
--    Le client est un vrai `customers.id` (créé au même titre qu'en
--    réservation manuelle, permet de réutiliser un client existant
--    et d'envisager plus tard la conversion devis → résa).
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Montants gelés au moment de la génération (snapshot).
  base_price NUMERIC(10, 2) NOT NULL,
  options_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cgl_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL,
  -- Date limite de validité — déduite de la durée paramétrée dans
  -- l'agence à la génération. Un devis peut être régénéré : on garde
  -- alors la date d'émission d'origine mais on recalcule valid_until.
  valid_until DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quotes_agency ON quotes(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vehicle ON quotes(vehicle_id);

-- 3. Lignes d'options attachées au devis — miroir exact de
--    `booking_options` (mêmes snapshots, même sémantique).
CREATE TABLE IF NOT EXISTS quote_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES options(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_price_snapshot NUMERIC(10, 2) NOT NULL,
  price_type_snapshot TEXT NOT NULL CHECK (price_type_snapshot IN ('per_day', 'flat')),
  name_snapshot TEXT NOT NULL,
  -- Snapshot du plafond mensuel au moment du devis (cf. Phase 7A).
  monthly_cap_snapshot NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_options_quote ON quote_options(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_options_option ON quote_options(option_id);

-- 4. Extension de `documents` pour accueillir les devis.
--    Le fichier PDF vit dans documents.file_path (comme factures et
--    contrats) — cohérence sur la page Documents admin.
ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_type_check
    CHECK (type IN ('invoice', 'contract', 'other', 'quote'));

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quote_number TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_quote ON documents(quote_id);
CREATE INDEX IF NOT EXISTS idx_documents_quote_number
  ON documents(quote_number)
  WHERE quote_number IS NOT NULL;

-- 5. Compteur devis par (organisation, année) — à des fins d'audit.
--    La vraie source de vérité pour la numérotation reste le MAX
--    existant sur documents.quote_number (cf. fonction ci-dessous).
CREATE TABLE IF NOT EXISTS quote_sequences (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INT NOT NULL,
  current_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, year)
);

-- 6. Fonction d'allocation du prochain numéro de devis — même logique
--    que `next_invoice_number` : MAX existant + 1, advisory lock pour
--    les appels concurrents, et alignement de la ligne de séquence.
CREATE OR REPLACE FUNCTION next_quote_number(
  p_organization_id UUID,
  p_year INT
) RETURNS INT AS $$
DECLARE
  v_max_existing INT;
  v_next INT;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_organization_id::text || ':quote:' || p_year::text, 0)
  );

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(d.quote_number FROM 'DEV-\d{4}-(\d+)$') AS INT)
  ), 0)
  INTO v_max_existing
  FROM documents d
  JOIN agencies a ON a.id = d.agency_id
  WHERE d.quote_number ~ ('^DEV-' || p_year || '-\d+$')
    AND a.organization_id = p_organization_id;

  v_next := v_max_existing + 1;

  INSERT INTO quote_sequences (organization_id, year, current_number)
  VALUES (p_organization_id, p_year, v_next)
  ON CONFLICT (organization_id, year)
  DO UPDATE SET
    current_number = v_next,
    updated_at = NOW();

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;
