-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_place TEXT,
  address TEXT NOT NULL,
  address2 TEXT,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  driver_license_number TEXT,
  driver_license_issued_at DATE,
  driver_license_country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agency_id ON bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
-- Allow anyone to insert (for new bookings)
CREATE POLICY "Allow insert for anyone" ON customers
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own customer data
CREATE POLICY "Allow read own data" ON customers
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update their own customer data
CREATE POLICY "Allow update own data" ON customers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for bookings
-- Allow anyone to insert (for new bookings)
CREATE POLICY "Allow insert for anyone" ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own bookings
CREATE POLICY "Allow read own bookings" ON bookings
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = user_id
    )
  );

-- Allow users to update their own bookings (for future cancellations, etc.)
CREATE POLICY "Allow update own bookings" ON bookings
  FOR UPDATE
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = user_id
    )
  );
