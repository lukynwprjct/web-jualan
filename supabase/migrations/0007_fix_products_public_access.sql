-- ============================================
-- FIX PRODUCTS PUBLIC ACCESS
-- Allow anonymous users to view products
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Anyone can view products" ON products;

-- Products: Everyone can view (including anonymous)
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

-- Verify
SELECT polname, tablename, rolname 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'products';
