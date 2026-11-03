-- Create brand_settings table
CREATE TABLE IF NOT EXISTS brand_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read for public settings
CREATE POLICY "Allow public read for public settings"
  ON brand_settings
  FOR SELECT
  USING (is_public = true);

-- RLS Policy: Allow authenticated users to write
CREATE POLICY "Allow authenticated write"
  ON brand_settings
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_brand_settings_updated_at
  BEFORE UPDATE ON brand_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default brand settings for Luxky
INSERT INTO brand_settings (key, value, description, is_public) VALUES
-- General Settings
('brand_name', 'Luxky', 'Nama brand toko', true),
('brand_slogan', 'Barang Bekas Berkualitas, Harga Terjangkau', 'Slogan toko', true),
('brand_description', 'Platform e-commerce terpercaya untuk barang bekas berkualitas (preloved/secondhand) seperti vape, fashion, sparepart motor, dan serba ada.', 'Deskripsi brand', true),
('about_us', 'Luxky adalah platform e-commerce terpercaya yang menyediakan berbagai macam barang bekas berkualitas (preloved / secondhand) untuk kebutuhan gaya hidup, hobi, hingga otomotif. Mulai dari perlengkapan vape, pakaian/fashion, hingga sparepart motor bekas layak pakai—kami siap membantu Anda menemukan barang impian dengan harga yang jauh lebih terjangkau namun tetap mengutamakan kualitas dan kondisi barang yang baik.', 'Tentang kami', true),
('logo_url', '', 'URL logo toko', true),
('favicon_url', '', 'URL favicon toko', true),

-- Contact Settings
('whatsapp_number', '6285178965265', 'Nomor WhatsApp bot', true),
('whatsapp_label', 'Chat dengan kami', 'Label tombol WhatsApp', true),
('email', 'info@luxky.com', 'Email kontak', true),
('phone', '085755970912', 'Nomor telepon', true),
('address', 'Jl. Premium No. 123, Malang Kota, 65111, Indonesia', 'Alamat toko', true),

-- Social Media
('instagram', '', 'Username Instagram', true),
('facebook', '', 'Username Facebook', true),
('twitter', '', 'Username Twitter/X', true),
('youtube', '', 'Channel YouTube', true),
('linkedin', '', 'LinkedIn company page', true),

-- Meta Tags
('meta_title', 'Luxky - Toko Barang Bekas Berkualitas di Malang', 'Meta title untuk SEO', true),
('meta_description', 'Luxky jual barang bekas berkualitas seperti vape, fashion, sparepart motor di Malang. Harga terjangkau, kondisi siap pakai, transparan.', 'Meta description untuk SEO', true),
('meta_keywords', 'barangebekas,malang,preloved,secondhand,vape,fashion,sparepartmotor,terjangkau', 'Meta keywords untuk SEO', true)

ON CONFLICT (key) DO NOTHING;
