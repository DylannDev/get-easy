-- Add expires_at column to bookings table for pending payment expiration
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create index on expires_at and status for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at_status
ON bookings(expires_at, status)
WHERE status = 'pending_payment' AND expires_at IS NOT NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN bookings.expires_at IS
'Expiration timestamp for pending_payment bookings. After this time, the booking should be marked as expired and dates released.';
