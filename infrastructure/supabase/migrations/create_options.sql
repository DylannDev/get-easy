-- Phase 6B — Gestion des options additionnelles
-- Table options: référentiel éditable par l'agence
-- Table booking_options: lignes attachées à une réservation, prix figé au moment
-- de la réservation (snapshot) pour préserver l'historique.

CREATE TABLE IF NOT EXISTS options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_type TEXT NOT NULL CHECK (price_type IN ('per_day', 'flat')),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  max_quantity INT NOT NULL DEFAULT 1 CHECK (max_quantity >= 1),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_options_agency_active ON options(agency_id, active, sort_order);

CREATE TABLE IF NOT EXISTS booking_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES options(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_price_snapshot NUMERIC(10, 2) NOT NULL,
  price_type_snapshot TEXT NOT NULL CHECK (price_type_snapshot IN ('per_day', 'flat')),
  name_snapshot TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_options_booking ON booking_options(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_options_option ON booking_options(option_id);

-- Trigger pour updated_at sur options
CREATE OR REPLACE FUNCTION set_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_options_updated_at ON options;
CREATE TRIGGER trg_options_updated_at
BEFORE UPDATE ON options
FOR EACH ROW EXECUTE FUNCTION set_options_updated_at();
