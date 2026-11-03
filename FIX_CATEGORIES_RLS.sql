-- ============================================
-- FIX RLS POLICY UNTUK CATEGORIES
-- ============================================

-- Drop policy lama jika ada
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "ADMIN+ can insert categories" ON categories;
DROP POLICY IF EXISTS "ADMIN+ can update categories" ON categories;
DROP POLICY IF EXISTS "ADMIN+ can delete categories" ON categories;

-- Create policy baru dengan email check
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ADMIN+ can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') 
    OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com'
  );

CREATE POLICY "ADMIN+ can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') 
    OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com'
  );

CREATE POLICY "ADMIN+ can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') 
    OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com'
  );
