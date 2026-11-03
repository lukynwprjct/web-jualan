-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read for public settings" ON brand_settings;
DROP POLICY IF EXISTS "Allow authenticated write" ON brand_settings;

-- Enable RLS
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

-- Read: Public (untuk development, biar bisa dilihat tanpa login)
CREATE POLICY "Allow public read" ON brand_settings FOR SELECT USING (true);

-- Write: Public (untuk development, biar bisa update tanpa login)
-- INPRODUCTION: Ganti ke `auth.role() = 'authenticated'` setelah deploy
CREATE POLICY "Allow public write" ON brand_settings FOR ALL USING (true);
