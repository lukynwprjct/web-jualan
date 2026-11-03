-- ============================================
-- DEVELOPMENT MODE: Disable RLS untuk testing
-- ============================================
-- WARNING: Jangan gunakan ini di production!

-- Disable RLS pada semua tabel
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE bot_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs DISABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE ADMIN USER VIA SUPABASE AUTH (MANUAL)
-- ============================================
-- 1. Buka Authentication → Users → Create new user
-- 2. Email: superadmin@luxky.com
-- 3. Password: (set password)
-- 4. Auto Confirm: YES
-- 5. Set metadata:
--    {
--      "full_name": "Superadmin Luxky",
--      "role": "SUPERADMIN"
--    }
-- ============================================

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Brand Settings (sudah ada dari migration awal, tapi jalanin lagi buat pasti)
INSERT INTO brand_settings (brand_name, brand_slogan, cv_link, contact_whatsapp)
VALUES ('Luxky', 'Premium Products For Discerning Taste', 'https://luxky.sija-smkn11malang.my.id/', '6285755970913')
ON CONFLICT DO NOTHING;

-- Default Categories
INSERT INTO categories (name, description, image_url, is_active)
VALUES 
  ('Electronics', 'Gadget and electronic devices', NULL, true),
  ('Fashion', 'Men and women fashion', NULL, true),
  ('Accessories', 'Watches, bags, and more', NULL, true),
  ('Lifestyle', 'Home and lifestyle products', NULL, true)
ON CONFLICT (name) DO NOTHING;

-- Sample Products (ganti category_id dengan ID yang sesuai dari query: SELECT id FROM categories WHERE name = 'Electronics')
-- Untuk testing, ganti 'category-id-placeholder' dengan ID actual
INSERT INTO products (name, description, price, category_id, image_url, status, stock)
VALUES 
  ('Luxky Smart Watch Pro', 'Premium smart watch dengan fitur canggih dan tahan air', 2999000, 'category-id-placeholder', 'https://i.ibb.co/7yF0vZj/placeholder.jpg', 'READY', 10),
  ('Premium Leather Bag', 'Tas kulit asli untuk gaya profesional', 1499000, 'category-id-placeholder', 'https://i.ibb.co/7yF0vZj/placeholder.jpg', 'READY', 5),
  ('Wireless Earbuds', 'Earbuds nirkabel dengan noise cancellation', 899000, 'category-id-placeholder', 'https://i.ibb.co/7yF0vZj/placeholder.jpg', 'READY', 20),
  ('Leather Wallet', 'Dompet kulit minimalis dengan slots banyak', 299000, 'category-id-placeholder', 'https://i.ibb.co/7yF0vZj/placeholder.jpg', 'READY', 15)
ON CONFLICT DO NOTHING;

-- ============================================
-- CREATE TRIGGERS (untuk auto update timestamp)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables (drop dulu kalo udah ada)
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_brand_settings_updated_at ON brand_settings;
CREATE TRIGGER update_brand_settings_updated_at
  BEFORE UPDATE ON brand_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_bot_events_updated_at ON bot_events;
CREATE TRIGGER update_bot_events_updated_at
  BEFORE UPDATE ON bot_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- Database siap digunakan!
-- 
-- Test Login:
-- 1. Buka: http://192.168.100.25:3000/admin/login
-- 2. Gunakan email/password yang dibuat via Supabase Auth
-- 3. Dashboard akan load data products, categories, dll
-- ============================================
