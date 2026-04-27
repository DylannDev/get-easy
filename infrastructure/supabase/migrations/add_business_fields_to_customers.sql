-- Adds optional business fields on customers.
-- A customer is considered a "business" (pro) if `company_name` is non-null.
-- No discriminator enum: presence of company_name acts as the type marker —
-- keeps the schema flat and avoids enum migrations.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS siret TEXT,
  ADD COLUMN IF NOT EXISTS vat_number TEXT;
