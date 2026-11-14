-- ============================================================
-- CHATBOT AI - TABEL & PENGATURAN
-- Luxky E-Commerce — 2026-11-14
-- Jalankan di Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABEL chat_sessions (1 sesi = 1 pengunjung ngobrol)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,                -- id anonim dari browser pengunjung
  status text NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | ESCALATED | CLOSED
  escalated boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index biar pencarian cepat
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor ON chat_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at DESC);

-- ------------------------------------------------------------
-- 2. TABEL chat_messages (isi percakapan)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,                      -- 'user' | 'assistant'
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);

-- ------------------------------------------------------------
-- 3. TABEL bot_settings (pengaturan custom — bisa diubah dari dashboard)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bot_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Nilai default (ubah lewat dashboard nanti, jangan hardcode di kode)
INSERT INTO bot_settings (key, value, description) VALUES
  ('max_discount_percent', '10', 'Diskon maksimal (%) yang boleh diberikan AI tanpa approval admin'),
  ('negotiation_enabled', 'true', 'Aktif/nonaktifkan fitur negosiasi harga oleh AI'),
  ('escalation_whatsapp', '6285178965265', 'Nomor WA tujuan eskalasi saat AI tidak bisa menjawab'),
  ('bot_persona', 'Kamu customer service Luxky Store: ramah, santai tapi sopan, jawab singkat dan jelas pakai bahasa Indonesia', 'Kepribadian & gaya bahasa bot'),
  ('bot_enabled', 'true', 'Aktif/nonaktifkan chatbot di web'),
  ('welcome_message', 'Hai! 👋 Aku asisten virtual Luxky Store. Mau tanya produk, harga, atau negosiasi? Silakan!', 'Pesan sambutan pertama kali chat dibuka')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- 4. RLS
--    - Pengunjung (anon): boleh bikin sesi + kirim pesan VIA EDGE FUNCTION
--      (bukan insert langsung), boleh baca pesan sesinya sendiri.
--    - Admin: bisa lihat semua sesi & pesan (untuk dashboard).
--    - bot_settings: baca publik tidak perlu -> cuma admin; Edge Function
--      pakai service role jadi tetap bisa baca.
-- ------------------------------------------------------------

-- Chat sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;

-- Admin lihat semua
CREATE POLICY "ADMIN+ can view chat sessions"
  ON chat_sessions FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "ADMIN+ can manage chat sessions"
  ON chat_sessions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Anon TIDAK diberi policy apa pun di chat_sessions/chat_messages:
-- semua tulisan lewat Edge Function (service role), jadi aman dari spam langsung.

-- bot_settings: cuma admin
CREATE POLICY "ADMIN+ can view bot settings"
  ON bot_settings FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "ADMIN+ can manage bot settings"
  ON bot_settings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- SELESAI. Tabel siap dipakai Edge Function web-chat.
-- ============================================================
