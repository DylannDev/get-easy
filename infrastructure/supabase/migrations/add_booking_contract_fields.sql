-- Phase 6A.3 — Édition du contrat dans l'application.
--
-- Le contrat n'est plus un PDF éditable (AcroForm). Toutes les valeurs
-- saisies par la gérante sont stockées en BDD et régénèrent un PDF plat
-- (non modifiable) à chaque enregistrement.
--
-- `fields` contient tout ce qui est éditable côté locataire / véhicule /
-- durée / montants, sous forme JSONB pour évolution souple.
-- Les signatures sont des PNG base64 (taille modeste : ~50-200 Ko par
-- signature dessinée sur 400 x 150 px).

CREATE TABLE IF NOT EXISTS booking_contract_fields (
  booking_id UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  customer_signature TEXT,
  loueur_signature TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_booking_contract_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_contract_fields_updated_at
  ON booking_contract_fields;
CREATE TRIGGER trg_booking_contract_fields_updated_at
BEFORE UPDATE ON booking_contract_fields
FOR EACH ROW EXECUTE FUNCTION set_booking_contract_fields_updated_at();
