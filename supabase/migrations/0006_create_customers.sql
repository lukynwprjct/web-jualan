-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view customers" ON customers;
DROP POLICY IF EXISTS "Admin can insert customers" ON customers;

-- Policy: Anyone can insert (public registration)
CREATE POLICY "Anyone can insert customers"
  ON customers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Admin can view all customers
CREATE POLICY "Admin can view customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Policy: Admin can delete customers
CREATE POLICY "Admin can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');
