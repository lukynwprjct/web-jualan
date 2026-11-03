-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ADMIN USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('SUPERADMIN', 'ADMIN', 'STAFF')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. BRAND SETTINGS TABLE (Superadmin only)
-- ============================================
CREATE TABLE IF NOT EXISTS brand_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name TEXT NOT NULL DEFAULT 'Luxky',
  brand_slogan TEXT DEFAULT 'Premium Products For Discerning Taste',
  cv_link TEXT DEFAULT 'https://luxky.sija-smkn11malang.my.id/',
  contact_whatsapp TEXT DEFAULT '6285755970913',
  contact_email TEXT,
  social_media TEXT, -- JSON format
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  category_id UUID REFERENCES categories(id),
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'READY' CHECK (status IN ('READY', 'RESERVED', 'SOLD')),
  stock INTEGER DEFAULT 0,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. CUSTOMERS TABLE (WhatsApp deduplication)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whatsapp_normalized TEXT UNIQUE NOT NULL, -- Normalized for deduplication
  whatsapp_display TEXT NOT NULL,
  full_name TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. INQUIRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_price BIGINT NOT NULL,
  product_category TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  customer_address TEXT,
  quantity INTEGER DEFAULT 1,
  total_price BIGINT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'COMPLETED', 'CANCELLED')),
  admin_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. BOT EVENT QUEUE ( untuk notifikasi saat bot offline )
-- ============================================
CREATE TABLE IF NOT EXISTS bot_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('INQUIRY_CREATED', 'INQUIRY_UPDATED', 'PRODUCT_RESERVED', 'PRODUCT_SOLD')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. LOG TABLE ( untuk tracking admin actions )
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES ( untuk performance )
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_product ON inquiries(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp_normalized);
CREATE INDEX IF NOT EXISTS idx_bot_events_status ON bot_events(status);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADMIN USERS RLS
-- ============================================
CREATE POLICY "SUPERADMIN full access" ON admin_users
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'SUPERADMIN'))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'SUPERADMIN'));

CREATE POLICY "ADMIN read all" ON admin_users
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

CREATE POLICY "ADMIN create staff" ON admin_users
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

CREATE POLICY "ADMIN update staff" ON admin_users
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

-- ============================================
-- BRAND SETTINGS RLS (Superadmin only)
-- ============================================
CREATE POLICY "SUPERADMIN brand settings" ON brand_settings
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'SUPERADMIN'))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'SUPERADMIN'));

-- ============================================
-- CATEGORIES RLS
-- ============================================
CREATE POLICY "All read categories" ON categories
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "ADMIN manage categories" ON categories
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

-- ============================================
-- PRODUCTS RLS
-- ============================================
CREATE POLICY "All read products" ON products
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "ADMIN manage products" ON products
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

-- ============================================
-- CUSTOMERS RLS
-- ============================================
CREATE POLICY "All read customers" ON customers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff create customers" ON customers
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN', 'STAFF')));

CREATE POLICY "Staff update customers" ON customers
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN', 'STAFF')));

-- ============================================
-- INQUIRIES RLS
-- ============================================
CREATE POLICY "All read inquiries" ON inquiries
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff create inquiries" ON inquiries
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN', 'STAFF')));

CREATE POLICY "ADMIN manage inquiries" ON inquiries
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

-- ============================================
-- BOT EVENTS RLS
-- ============================================
CREATE POLICY "All read bot events" ON bot_events
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System create bot events" ON bot_events
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System update bot events" ON bot_events
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- ADMIN LOGS RLS
-- ============================================
CREATE POLICY "All read admin logs" ON admin_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System create admin logs" ON admin_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGER: update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
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
-- INITIAL DATA (Superadmin default)
-- ============================================
INSERT INTO admin_users (email, full_name, role)
VALUES ('superadmin@luxky.com', 'Superadmin Luxky', 'SUPERADMIN')
ON CONFLICT (email) DO NOTHING;

INSERT INTO brand_settings (brand_name, brand_slogan, cv_link, contact_whatsapp)
VALUES ('Luxky', 'Premium Products For Discerning Taste', 'https://luxky.sija-smkn11malang.my.id/', '6285755970913')
ON CONFLICT DO NOTHING;
