-- ============================================
-- FIX RLS POLICIES - Luxky E-Commerce
-- Tanggal: 2026-11-14
-- Cara pakai: Supabase Dashboard → SQL Editor → paste → Run
-- Rollback: jalankan backup_policies_before_fix.sql
-- ============================================

-- 1. CATEGORIES: bug fix - pengunjung web (anon) harus bisa LIHAT kategori
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT TO public USING (true);

-- 2. BRAND_SETTINGS: public hanya baca yang is_public, tulis cuma admin
DROP POLICY IF EXISTS "Allow public write" ON brand_settings;
DROP POLICY IF EXISTS "Allow public read" ON brand_settings;
CREATE POLICY "Public can view brand settings"
  ON brand_settings FOR SELECT TO public USING (is_public = true);
CREATE POLICY "ADMIN+ can manage brand settings"
  ON brand_settings FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('SUPERADMIN','ADMIN')
    OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('SUPERADMIN','ADMIN')
    OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com'
  );

-- 3. PENDING_DEALS: tutup dari publik, hanya admin/staff
DROP POLICY IF EXISTS "pending_deals_all" ON pending_deals;
CREATE POLICY "ADMIN+ can manage pending deals"
  ON pending_deals FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('SUPERADMIN','ADMIN','STAFF')
    OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('SUPERADMIN','ADMIN','STAFF')
    OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com'
  );

-- 4. BROADCAST_BLOCKLIST: tutup dari publik, hanya admin
DROP POLICY IF EXISTS "allow_public_select_broadcast_blocklist" ON broadcast_blocklist;
DROP POLICY IF EXISTS "allow_admin_insert_blocklist" ON broadcast_blocklist;
DROP POLICY IF EXISTS "allow_admin_delete_blocklist" ON broadcast_blocklist;
CREATE POLICY "ADMIN+ can view blocklist"
  ON broadcast_blocklist FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN','ADMIN','STAFF'));
CREATE POLICY "ADMIN+ can manage blocklist"
  ON broadcast_blocklist FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN','ADMIN'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('SUPERADMIN','ADMIN'));

-- 5. BROADCAST_HISTORY: tutup dari publik, hanya admin/staff
DROP POLICY IF EXISTS "allow_public_select_broadcast_history" ON broadcast_history;
CREATE POLICY "ADMIN+ can view broadcast history"
  ON broadcast_history FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN','ADMIN','STAFF'));

-- 6. USER_IDENTITIES: orang boleh kirim identitas (form), cuma admin yang boleh LIHAT
DROP POLICY IF EXISTS "Allow public read" ON user_identities;
CREATE POLICY "ADMIN+ can view user identities"
  ON user_identities FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN','ADMIN','STAFF'));

-- 7. CUSTOMERS: hapus policy delete yang longgar
--    (policy "ADMIN+ can delete customers" yang ketat tetap berlaku)
DROP POLICY IF EXISTS "Admin can delete customers" ON customers;
