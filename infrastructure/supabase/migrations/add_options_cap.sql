-- Phase 7A — Plafond mensuel sur les options.
--
-- Certaines options (ex. siège bébé à 5 €/jour) ne doivent pas dépasser un
-- montant mensuel (ex. 50 €/mois). Ce mécanisme ne s'applique qu'aux options
-- `price_type = 'per_day'` — pour les options `flat`, le plafonnement n'a pas
-- de sens.
--
-- Règle de calcul :
--   - nombre de mois entamés = ceil(numberOfDays / 30)
--   - coût plafonné        = monthsStarted × monthly_cap × quantity
--   - coût facturé         = min(coût théorique, coût plafonné)

ALTER TABLE options
  ADD COLUMN IF NOT EXISTS cap_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS monthly_cap NUMERIC(10, 2) CHECK (monthly_cap IS NULL OR monthly_cap >= 0);
