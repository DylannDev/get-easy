-- ⚡ Index Optimisé pour Webhook Stripe - Validation des Dates
-- Date: 2025-12-03
-- Description: Accélère la vérification de disponibilité dans le webhook
--              en indexant spécifiquement les bookings "paid"

-- Supprimer l'ancien index s'il existe
DROP INDEX IF EXISTS idx_bookings_vehicle_status_end_date;

-- Créer un index partiel sur les bookings payés
-- Cet index est utilisé par la query de VALIDATION 3 du webhook
CREATE INDEX IF NOT EXISTS idx_bookings_paid_availability
ON bookings(vehicle_id, end_date, start_date)
WHERE status = 'paid';

-- Pourquoi cet index ?
-- 1. Webhook vérifie UNIQUEMENT les bookings avec status = 'paid'
-- 2. Filtre par vehicle_id (premier critère)
-- 3. Filtre par end_date >= booking.start_date (second critère)
-- 4. Besoin de start_date et end_date pour l'overlap check

-- Performance attendue :
-- AVANT : ~10-20ms (scan de tous les bookings du véhicule)
-- APRÈS : ~2-5ms (index scan direct sur les "paid")

-- Query optimisée par cet index :
-- SELECT id, start_date, end_date
-- FROM bookings
-- WHERE vehicle_id = ?
--   AND status = 'paid'
--   AND end_date >= ?

-- Analyse de l'impact :
-- - Index partiel → uniquement les "paid" (< 5% des bookings)
-- - Taille index réduite → meilleure performance cache
-- - Couverture parfaite de la query webhook

-- Note : Les bookings "pending_payment" n'ont plus besoin d'index
-- car ils ne sont plus vérifiés dans le webhook
