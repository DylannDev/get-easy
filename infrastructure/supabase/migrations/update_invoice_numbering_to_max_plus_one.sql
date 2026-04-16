-- Phase 6A.2 (correction) — La numérotation des factures se base désormais
-- sur le MAX existant dans `documents` (au lieu d'un compteur monotone).
--
-- Comportement souhaité :
--  - Pas de facture cette année → prochaine = FAC-{year}-001
--  - FAC-{year}-007 existe et est la plus haute → prochaine = FAC-{year}-008
--  - L'utilisateur supprime FAC-{year}-008 → prochaine = FAC-{year}-008 (réutilisée)
--
-- La table `invoice_sequences` reste alimentée à des fins d'audit et est mise
-- à jour à chaque appel.
--
-- ⚠ Race-condition possible si deux générations parallèles (peu probable côté
--    admin) → on l'accepte, comme la plupart des outils SaaS de facturation.
--    Si nécessaire, on ajoutera une contrainte d'unicité dénormalisée.

CREATE OR REPLACE FUNCTION next_invoice_number(
  p_organization_id UUID,
  p_year INT
) RETURNS INT AS $$
DECLARE
  v_max_existing INT;
  v_next INT;
BEGIN
  -- Verrou consultatif pour serialiser les appels concurrents au sein du
  -- même processus Postgres (libéré à la fin de la transaction de la RPC).
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_organization_id::text || ':' || p_year::text, 0)
  );

  -- Cherche le plus grand numéro déjà attribué pour (organisation, année).
  -- On rejoint via agencies pour scoper par organisation.
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(d.invoice_number FROM 'FAC-\d{4}-(\d+)$') AS INT)
  ), 0)
  INTO v_max_existing
  FROM documents d
  JOIN agencies a ON a.id = d.agency_id
  WHERE d.invoice_number ~ ('^FAC-' || p_year || '-\d+$')
    AND a.organization_id = p_organization_id;

  v_next := v_max_existing + 1;

  -- Maintient la ligne `invoice_sequences` en cohérence (utile pour les
  -- futurs reportings ou tableaux de bord d'audit).
  INSERT INTO invoice_sequences (organization_id, year, current_number)
  VALUES (p_organization_id, p_year, v_next)
  ON CONFLICT (organization_id, year)
  DO UPDATE SET
    current_number = v_next,
    updated_at = NOW();

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;
