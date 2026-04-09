-- Migration: Rendre customer_id nullable pour supporter les bookings "initiated"
-- Date: 2025-12-10
-- Description:
--   Permet de créer des bookings avec status="initiated" sans customer_id
--   Le customer_id sera ajouté lors du passage à "pending_payment"

-- Étape 1: Modifier la colonne customer_id pour la rendre nullable
ALTER TABLE bookings
ALTER COLUMN customer_id DROP NOT NULL;

-- Étape 2: Ajouter un commentaire pour documenter la logique
COMMENT ON COLUMN bookings.customer_id IS
'ID du client. Peut être NULL pour les bookings avec status="initiated".
Doit être renseigné pour les status "pending_payment", "paid", "cancelled", "expired".';
