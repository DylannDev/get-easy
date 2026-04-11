-- Add contact and delivery info fields to agencies
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS delivery_zones text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS delivery_label text;

-- Seed existing agency with current hardcoded values
UPDATE agencies SET
  phone = '06 94 03 06 70',
  email = 'contact@geteasylocation.com',
  delivery_label = 'Livraison gratuite',
  delivery_zones = 'Cayenne, Rémire-Montjoly, Matoury et Aéroport'
WHERE phone IS NULL;
