-- ============================================
-- FIX RLS POLICY FOR DEVELOPMENT
-- Allow lukfanddyyy@gmail.com to manage everything
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "SUPERADMIN can delete admin users" ON admin_users;
DROP POLICY IF EXISTS "ADMIN+ can delete categories" ON categories;
DROP POLICY IF EXISTS "ADMIN+ can delete products" ON products;
DROP POLICY IF EXISTS "ADMIN+ can delete customers" ON customers;
DROP POLICY IF EXISTS "ADMIN+ can delete inquiries" ON inquiries;
DROP POLICY IF EXISTS "ADMIN+ can delete bot events" ON bot_events;

-- Admin Users: Allow lukfanddyyy@gmail.com to manage
CREATE POLICY "lukfanddyyy@gmail.com can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Categories: Allow lukfanddyyy@gmail.com to manage
CREATE POLICY "lukfanddyyy@gmail.com can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Products: Allow lukfanddyyy@gmail.com to manage
CREATE POLICY "lukfanddyyy@gmail.com can manage products"
  ON products FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Customers: Allow lukfanddyyy@gmail.com to manage
CREATE POLICY "lukfanddyyy@gmail.com can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Inquiries: Allow lukfanddyyy@gmail.com to manage
CREATE POLICY "lukfanddyyy@gmail.com can manage inquiries"
  ON inquiries FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Bot Events: Allow lukfanddyyy@gmail.com to manage
CREATE POLICY "lukfanddyyy@gmail.com can manage bot events"
  ON bot_events FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Verify
SELECT polname, tablename FROM pg_policies WHERE schemaname = 'public';
