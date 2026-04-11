-- Add optional comment column to blocked_periods
ALTER TABLE blocked_periods ADD COLUMN IF NOT EXISTS comment text;
