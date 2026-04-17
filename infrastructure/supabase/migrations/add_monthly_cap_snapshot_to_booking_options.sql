-- Phase 7A — Snapshot du plafond mensuel sur booking_options.
--
-- Pour que la facture ou le contrat puissent être régénérés correctement
-- même si le plafond de l'option change ultérieurement, on stocke le
-- plafond en vigueur au moment de la réservation (comme pour le prix
-- unitaire et le nom). NULL = pas de plafond applicable (option flat ou
-- cap_enabled = false au moment de l'achat).

ALTER TABLE booking_options
  ADD COLUMN IF NOT EXISTS monthly_cap_snapshot NUMERIC(10, 2)
    CHECK (monthly_cap_snapshot IS NULL OR monthly_cap_snapshot >= 0);
