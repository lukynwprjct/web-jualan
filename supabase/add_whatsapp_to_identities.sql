-- ============================================================
-- TAMBAH KOLOM WHATSAPP DI user_identities
-- Untuk gerbang toko (nama + lokasi + no WA pengunjung)
-- Jalankan di Supabase Dashboard → SQL Editor → Run
-- Rollback: ALTER TABLE user_identities DROP COLUMN whatsapp;
-- ============================================================

ALTER TABLE user_identities
  ADD COLUMN IF NOT EXISTS whatsapp text;

-- Index biar pencarian nomor cepat
CREATE INDEX IF NOT EXISTS idx_user_identities_whatsapp
  ON user_identities(whatsapp);
