-- ============================================================
-- STORAGE: bucket foto produk
-- Luxky E-Commerce — 2026-11-16
-- Jalankan di Supabase Dashboard → SQL Editor → Run
-- Rollback:
--   DELETE FROM storage.buckets WHERE id='product-images';
--   DROP POLICY ... (daftar di bawah)
-- ============================================================

-- 1. Buat bucket publik untuk foto produk
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. SEMUA ORANG boleh LIHAT foto (web publik menampilkan produk)
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');

-- 3. CUMA ADMIN yang boleh upload / ubah / hapus foto
CREATE POLICY "Admin upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admin update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admin delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());
