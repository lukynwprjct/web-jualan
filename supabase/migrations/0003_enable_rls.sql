-- ============================================
-- 1. ENABLE RLS ON TABLES
-- ============================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE RLS POLICIES
-- ============================================

-- Development mode: allow specific user for testing
-- Admin Users: Hanya SUPERADMIN bisa manage
CREATE POLICY "SUPERADMIN can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'SUPERADMIN' OR 
    auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com'
  );

CREATE POLICY "SUPERADMIN can insert admin users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'SUPERADMIN' OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "SUPERADMIN can update admin users"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'SUPERADMIN' OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "SUPERADMIN can delete admin users"
  ON admin_users FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'SUPERADMIN' OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Brand Settings: Everyone can view, only SUPERADMIN can update
CREATE POLICY "Anyone can view brand settings"
  ON brand_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "SUPERADMIN can update brand settings"
  ON brand_settings FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'SUPERADMIN')
  WITH CHECK (auth.jwt() ->> 'role' = 'SUPERADMIN');

-- Categories: Everyone can view, ADMIN+ can manage
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Development mode: disable RLS untuk testing
-- ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

CREATE POLICY "ADMIN+ can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Products: Everyone can view, ADMIN+ can manage
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ADMIN+ can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Customers: Everyone can view, ADMIN+ can manage
CREATE POLICY "Anyone can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ADMIN+ can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Inquiries: Everyone can view (untuk展示), ADMIN+ can manage
CREATE POLICY "Anyone can view inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ADMIN+ can insert inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN', 'STAFF') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can update inquiries"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN', 'STAFF') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can delete inquiries"
  ON inquiries FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Bot Events: ADMIN+ can manage
CREATE POLICY "ADMIN+ can view bot events"
  ON bot_events FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can insert bot events"
  ON bot_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can update bot events"
  ON bot_events FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can delete bot events"
  ON bot_events FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

-- Admin Logs: ADMIN+ can view
CREATE POLICY "ADMIN+ can view admin logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');

CREATE POLICY "ADMIN+ can insert admin logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' IN ('SUPERADMIN', 'ADMIN') OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com');
