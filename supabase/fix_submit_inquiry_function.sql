-- ============================================================
-- FUNGSI AMAN submit_inquiry + policy pendukung
-- Luxky E-Commerce — 2026-11-14
--
-- Tujuan:
-- 1. Fix form inquiry pengunjung (anon) yang selalu gagal:
--    - INSERT bot_events dengan kolom yang tidak ada
--    - SELECT kolom 'phone_normalized' (kolom asli: whatsapp_normalized)
--    - UPDATE stok produk dari browser anonim (diblok RLS)
-- 2. Tutup celah: anonim tidak perlu INSERT langsung ke
--    customers / inquiries / bot_events / admin_logs
--
-- Bot WA TETAP jalan karena pakai service_role (melewati RLS).
-- Rollback: DROP FUNCTION public.submit_inquiry(uuid,text,text,text,integer) CASCADE;
-- ============================================================

-- ------------------------------------------------------------
-- A. FUNGSI submit_inquiry
--    (SECURITY DEFINER = jalan dengan hak pemilik fungsi,
--     jadi bisa menulis ke tabel ber-RLS secara terkontrol)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_inquiry(
  p_product_id uuid,
  p_customer_name text,
  p_customer_whatsapp text,   -- format 62xxx, tanpa +
  p_note text DEFAULT NULL,
  p_quantity integer DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_inquiry_id uuid;
  v_product record;
BEGIN
  -- ===== Validasi input =====
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 THEN
    RETURN json_build_object('ok', false, 'error', 'Nama minimal 2 karakter');
  END IF;

  IF p_customer_whatsapp IS NULL OR p_customer_whatsapp !~ '^[0-9]{9,15}$' THEN
    RETURN json_build_object('ok', false, 'error', 'Nomor WhatsApp tidak valid');
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100 THEN
    RETURN json_build_object('ok', false, 'error', 'Jumlah tidak valid (1-100)');
  END IF;

  -- ===== Ambil produk & cek status =====
  SELECT id, name, price, stock, status
    INTO v_product
    FROM products
   WHERE id = p_product_id;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Produk tidak ditemukan');
  END IF;

  IF v_product.status <> 'READY' THEN
    RETURN json_build_object('ok', false, 'error', 'Produk tidak tersedia');
  END IF;

  IF v_product.stock IS NOT NULL AND v_product.stock < p_quantity THEN
    RETURN json_build_object('ok', false, 'error', 'Stok tidak cukup');
  END IF;

  -- ===== Cek / buat customer =====
  SELECT id INTO v_customer_id
    FROM customers
   WHERE whatsapp_normalized = p_customer_whatsapp
   LIMIT 1;

  IF v_customer_id IS NULL THEN
    BEGIN
      INSERT INTO customers (full_name, whatsapp_display, whatsapp_normalized)
      VALUES (p_customer_name, '+' || p_customer_whatsapp, p_customer_whatsapp)
      RETURNING id INTO v_customer_id;
    EXCEPTION WHEN unique_violation THEN
      SELECT id INTO v_customer_id
        FROM customers
       WHERE whatsapp_normalized = p_customer_whatsapp
       LIMIT 1;
    END;
  END IF;

  -- ===== Kurangi stok (aman dari race condition) =====
  UPDATE products
     SET stock = stock - p_quantity,
         updated_at = now()
   WHERE id = p_product_id
     AND (stock IS NULL OR stock >= p_quantity);

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Stok tidak cukup');
  END IF;

  -- ===== Buat inquiry =====
  INSERT INTO inquiries (
    customer_id, product_id, product_name, product_price,
    customer_name, customer_whatsapp, note, status,
    quantity, total_price
  ) VALUES (
    v_customer_id, v_product.id, v_product.name, v_product.price,
    p_customer_name, p_customer_whatsapp, p_note, 'PENDING',
    p_quantity, v_product.price * p_quantity
  )
  RETURNING id INTO v_inquiry_id;

  -- ===== Kirim event ke WA bot (diproses oleh luxky-bot) =====
  INSERT INTO bot_events (
    event_type, target_type, target_id, message, status
  ) VALUES (
    'INQUIRY_CREATED', 'inquiry', v_inquiry_id,
    'Inquiry baru: ' || p_customer_name || ' (' || p_customer_whatsapp || ') - '
      || v_product.name || ' x' || p_quantity,
    'PENDING'
  );

  -- ===== Catat log admin =====
  INSERT INTO admin_logs (
    action, target_table, target_id, details
  ) VALUES (
    'INQUIRY_CREATED', 'inquiries', v_inquiry_id,
    json_build_object(
      'product', v_product.name,
      'customer', p_customer_name,
      'whatsapp', p_customer_whatsapp,
      'qty', p_quantity
    )
  );

  RETURN json_build_object(
    'ok', true,
    'inquiry_id', v_inquiry_id,
    'message', 'Inquiry berhasil dikirim'
  );
END;
$$;

-- ------------------------------------------------------------
-- B. IZINKAN ANONIM MEMANGGIL FUNGSI INI
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.submit_inquiry(uuid, text, text, text, integer)
  TO anon, authenticated;

-- ------------------------------------------------------------
-- C. POLICY PENDUKUNG
--    (anonim tidak lagi butuh INSERT langsung ke tabel apapun)
-- ------------------------------------------------------------

-- Hapus policy insert publik lama di customers (celah)
DROP POLICY IF EXISTS "Anyone can insert customers" ON customers;

-- Inquiry: anonim TIDAK bisa insert langsung, admin bisa lihat
DROP POLICY IF EXISTS "Anyone can view inquiries" ON inquiries;
CREATE POLICY "ADMIN+ can view inquiries"
  ON inquiries FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('SUPERADMIN','ADMIN','STAFF')
    OR auth.jwt() ->> 'email' = 'lukfanddyyy@gmail.com'
  );

-- bot_events & admin_logs: hanya service_role & admin
-- (tidak ada policy = tidak ada yang bisa akses via anon key)
DROP POLICY IF EXISTS "ADMIN+ can insert bot events" ON bot_events;
DROP POLICY IF EXISTS "ADMIN+ can update bot events" ON bot_events;
DROP POLICY IF EXISTS "ADMIN+ can delete bot events" ON bot_events;
DROP POLICY IF EXISTS "ADMIN+ can view bot events" ON bot_events;
CREATE POLICY "ADMIN+ can view bot events"
  ON bot_events FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' IN ('SUPERADMIN','ADMIN','STAFF'));

-- ============================================================
-- SELESAI. Web kini: lihat produk/kategori (public),
-- kirim inquiry via RPC submit_inquiry (aman),
-- admin kelola via authenticated, bot via service_role.
-- ============================================================
