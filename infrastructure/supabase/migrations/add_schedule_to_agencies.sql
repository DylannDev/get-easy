-- Add schedule JSON column to agencies for per-day opening hours
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS schedule jsonb;

-- Seed with default schedule (all days enabled, same hours)
UPDATE agencies SET schedule = '{
  "allDays": true,
  "days": {
    "lundi": { "enabled": true, "openTime": "07:00", "closeTime": "22:00" },
    "mardi": { "enabled": true, "openTime": "07:00", "closeTime": "22:00" },
    "mercredi": { "enabled": true, "openTime": "07:00", "closeTime": "22:00" },
    "jeudi": { "enabled": true, "openTime": "07:00", "closeTime": "22:00" },
    "vendredi": { "enabled": true, "openTime": "07:00", "closeTime": "22:00" },
    "samedi": { "enabled": true, "openTime": "07:00", "closeTime": "22:00" },
    "dimanche": { "enabled": true, "openTime": "07:00", "closeTime": "22:00" }
  }
}'::jsonb
WHERE schedule IS NULL;
