-- Phase 7E+7F — État des lieux (inspection) départ / retour.
--
-- Un état des lieux est lié à une réservation et un type (départ ou
-- retour). Il contient le kilométrage, le niveau de carburant, un
-- commentaire libre, et la signature du client. Les photos sont
-- stockées dans `inspection_photos` (N photos par rapport, chacune
-- avec une note optionnelle).
--
-- Le PDF signé est généré à la finalisation et inséré dans `documents`
-- (type "inspection") pour être accessible depuis la page Documents.

-- 1. Table principale — un rapport par (réservation, type).
CREATE TABLE IF NOT EXISTS inspection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  -- 'departure' = état des lieux de départ, 'return' = retour.
  type TEXT NOT NULL CHECK (type IN ('departure', 'return')),
  mileage INT,
  -- Niveau de carburant saisi par la gérante.
  fuel_level TEXT CHECK (fuel_level IN ('empty', '1/4', '1/2', '3/4', 'full')),
  -- Commentaire libre (observations générales).
  notes TEXT,
  -- Signature PNG base64 du client (même format que le contrat).
  customer_signature TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Un seul rapport par (réservation, type).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_inspection_reports_booking_type
  ON inspection_reports(booking_id, type);
CREATE INDEX IF NOT EXISTS idx_inspection_reports_booking
  ON inspection_reports(booking_id);

-- 2. Photos attachées à un rapport.
CREATE TABLE IF NOT EXISTS inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES inspection_reports(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  -- Note optionnelle par photo (ex. "Rayure aile arrière droite").
  note TEXT,
  -- Ordre d'affichage (0-based).
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_photos_report
  ON inspection_photos(report_id, sort_order);

-- 3. Extension du type de `documents` pour les PDFs d'état des lieux.
ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_type_check
    CHECK (type IN ('invoice', 'contract', 'other', 'quote', 'inspection'));

-- Référence optionnelle vers le rapport d'inspection (pour les docs
-- de type 'inspection'). Permet de retrouver le PDF à partir du rapport.
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS inspection_report_id UUID
    REFERENCES inspection_reports(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_inspection_report
  ON documents(inspection_report_id);

-- 4. Trigger updated_at sur inspection_reports.
CREATE OR REPLACE FUNCTION set_inspection_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inspection_reports_updated_at
  ON inspection_reports;
CREATE TRIGGER trg_inspection_reports_updated_at
BEFORE UPDATE ON inspection_reports
FOR EACH ROW EXECUTE FUNCTION set_inspection_reports_updated_at();
