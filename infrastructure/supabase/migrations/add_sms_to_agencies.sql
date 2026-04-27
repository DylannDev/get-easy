-- Phase 8D — Notif SMS admin sur réservation payée.
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sms_admin_phone TEXT;
