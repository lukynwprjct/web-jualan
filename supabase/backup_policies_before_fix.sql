-- ============================================
-- BACKUP POLICY LAMA (sebelum fix RLS 2026-11-14)
-- Rollback: jalankan file ini untuk kembali ke kondisi lama
-- ============================================

-- categories
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT TO authenticated USING (true);

-- brand_settings
DROP POLICY IF EXISTS "Allow public read" ON brand_settings;
DROP POLICY IF EXISTS "ADMIN+ can manage brand settings" ON brand_settings;
CREATE POLICY "Allow public read" ON brand_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write" ON brand_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- pending_deals
DROP POLICY IF EXISTS "ADMIN+ can manage pending deals" ON pending_deals;
CREATE POLICY "pending_deals_all" ON pending_deals FOR ALL TO public USING (true) WITH CHECK (true);

-- broadcast_blocklist
DROP POLICY IF EXISTS "ADMIN+ can manage blocklist" ON broadcast_blocklist;
CREATE POLICY "allow_public_select_broadcast_blocklist" ON broadcast_blocklist FOR SELECT TO public USING (true);
CREATE POLICY "allow_admin_insert_blocklist" ON broadcast_blocklist FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "allow_admin_delete_blocklist" ON broadcast_blocklist FOR DELETE TO public USING (true);

-- broadcast_history
DROP POLICY IF EXISTS "ADMIN+ can view broadcast history" ON broadcast_history;
CREATE POLICY "allow_public_select_broadcast_history" ON broadcast_history FOR SELECT TO public USING (true);

-- user_identities
DROP POLICY IF EXISTS "ADMIN+ can view user identities" ON user_identities;
CREATE POLICY "Allow public read" ON user_identities FOR SELECT TO public USING (true);

-- customers
DROP POLICY IF EXISTS "ADMIN+ can delete customers" ON customers;
CREATE POLICY "Admin can delete customers" ON customers FOR DELETE TO authenticated USING (true);

-- inquiries (belum ada insert public di kondisi lama)
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON inquiries;
