-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'created',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on booking_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

-- Create index on stripe_payment_intent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);

-- Create index on stripe_checkout_session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session_id ON payments(stripe_checkout_session_id);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow insert for anyone (needed for creating payments)
CREATE POLICY "Allow insert for anyone" ON payments
  FOR INSERT
  WITH CHECK (true);

-- Allow read for anyone (you may want to restrict this later)
CREATE POLICY "Allow read for anyone" ON payments
  FOR SELECT
  USING (true);

-- Allow update for anyone (needed for updating payment status)
CREATE POLICY "Allow update for anyone" ON payments
  FOR UPDATE
  USING (true);

-- Add constraint to ensure status has valid values
ALTER TABLE payments
  ADD CONSTRAINT check_payment_status
  CHECK (status IN ('created', 'requires_action', 'succeeded', 'failed', 'refunded'));

-- Add constraint to ensure currency is valid (you can extend this list)
ALTER TABLE payments
  ADD CONSTRAINT check_payment_currency
  CHECK (currency IN ('EUR', 'USD', 'GBP'));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Add comment to table for documentation
COMMENT ON TABLE payments IS 'Stores payment information for bookings, primarily Stripe payments';
COMMENT ON COLUMN payments.booking_id IS 'Foreign key reference to the booking';
COMMENT ON COLUMN payments.provider IS 'Payment provider (e.g., stripe)';
COMMENT ON COLUMN payments.amount IS 'Amount paid in the specified currency';
COMMENT ON COLUMN payments.currency IS 'Currency code (e.g., EUR, USD)';
COMMENT ON COLUMN payments.status IS 'Payment status: created, requires_action, succeeded, failed, refunded';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Stripe PaymentIntent ID';
COMMENT ON COLUMN payments.stripe_checkout_session_id IS 'Stripe Checkout Session ID';
