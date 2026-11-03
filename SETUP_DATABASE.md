# Setup Supabase Database untuk Luxky E-commerce

## 🚀 Quick Start (3 Menit)

### Langkah 1: Buka Supabase SQL Editor
1. Buka https://retpbhcztvthymtluesu.supabase.co/project/_/sql
2. Klik **"New Query"**

### Langkah 2: Copy & Run Migration
Copy isi file: `supabase/migrations/0001_initial_schema.sql`

Atau copy SQL ini (versi ringkas untuk testing):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admin Users Table
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

-- 2. Brand Settings Table
CREATE TABLE IF NOT EXISTS brand_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name TEXT NOT NULL DEFAULT 'Luxky',
  brand_slogan TEXT DEFAULT 'Premium Products For Discerning Taste',
  cv_link TEXT DEFAULT 'https://luxky.sija-smkn11malang.my.id/',
  contact_whatsapp TEXT DEFAULT '6285755970913',
  contact_email TEXT,
  social_media TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Products Table
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

-- 5. Customers Table (WhatsApp deduplication)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whatsapp_normalized TEXT UNIQUE NOT NULL,
  whatsapp_display TEXT NOT NULL,
  full_name TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Inquiries Table
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

-- 7. Bot Events Queue
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

-- 8. Admin Logs Table
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

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_product ON inquiries(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp_normalized);
CREATE INDEX IF NOT EXISTS idx_bot_events_status ON bot_events(status);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);

-- ============================================
-- RLS POLICIES (SIMPAN UNTUK PRODUCTION)
-- ============================================
-- Enable RLS (jangan di-enable untuk development/local testing)
-- ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bot_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INITIAL DATA
-- ============================================
-- Insert default superadmin (akan diganti saat setup Supabase Auth)
INSERT INTO admin_users (email, full_name, role)
VALUES ('superadmin@luxky.com', 'Superadmin Luxky', 'SUPERADMIN')
ON CONFLICT (email) DO NOTHING;

-- Insert default brand settings
INSERT INTO brand_settings (brand_name, brand_slogan, cv_link, contact_whatsapp)
VALUES ('Luxky', 'Premium Products For Discerning Taste', 'https://luxky.sija-smkn11malang.my.id/', '6285755970913')
ON CONFLICT DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, description, image_url, is_active)
VALUES 
  ('Electronics', 'Gadget and electronic devices', NULL, true),
  ('Fashion', 'Men and women fashion', NULL, true),
  ('Accessories', 'Watches, bags, and more', NULL, true),
  ('Lifestyle', 'Home and lifestyle products', NULL, true)
ON CONFLICT (name) DO NOTHING;
```

### Langkah 3: Insert Sample Product (untuk testing)
```sql
-- Get category ID
SELECT id FROM categories WHERE name = 'Electronics';

-- Insert sample product (ganti category_id dengan ID dari query di atas)
INSERT INTO products (name, description, price, category_id, image_url, status, stock)
VALUES (
  'Luxky Smart Watch Pro',
  'Premium smart watch dengan fitur canggih',
  2999000,
  'category-id-dari-query-di-atas',
  'https://i.ibb.co/7yF0vZj/placeholder.jpg',
  'READY',
  10
);
```

### Langkah 4: Setup Supabase Auth
1. Buka **Authentication** → **Providers**
2. Aktifkan **Email/Password**
3. Buka **Authentication** → **Users**
4. Klik **"Add user"** → **"Create new user"**
   - Email: `superadmin@luxky.com`
   - Password: (password kuat minimal 6 karakter)
   - Auto Confirm User: ✅ YES
5. Klik **"Create user"**
6. Set user metadata (klik icon edit pada user):
   ```json
   {
     "full_name": "Superadmin Luxky",
     "role": "SUPERADMIN"
   }
   ```

## 🛠️ Development Mode (RLS Disabled)
Untuk development/local testing, RLS bisa di-disable sementara:

```sql
-- Disable RLS untuk development
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE bot_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs DISABLE ROW LEVEL SECURITY;
```

## 🔐 Production Mode (RLS Enabled)
Untuk production, aktifkan RLS dengan policy yang aman. Lihat file:
`supabase/migrations/0001_initial_schema.sql` untuk policy lengkap.

## 📋 Checklist Setup
- [ ] Buka Supabase SQL Editor
- [ ] Copy & run migration SQL
- [ ] Setup Supabase Auth user
- [ ] Set user metadata (role: SUPERADMIN)
- [ ] Disable RLS untuk development
- [ ] Test login admin: http://192.168.100.25:3000/admin/login

## 📞 Support
Jika ada error:
1. Check SQL syntax error di editor
2. Pastikan UUID extension tersedia
3. Check foreign key reference valid
4. Review error message Supabase

## 🔄 Migration Log
- `0001_initial_schema.sql`: Initial database setup dengan 8 tables
