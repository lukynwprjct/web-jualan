// ============================================================
// Edge Function: web-chat
// Chatbot AI customer service Luxky Store
// - Membaca pengaturan dari bot_settings (custom via dashboard)
// - Membaca katalog produk ASLI dari tabel products (anti-ngawur)
// - Gemini AI dengan aturan ketat: hanya jawab dari data yang diberikan
// - Eskalasi ke WA admin saat AI tidak bisa menyelesaikan
// ============================================================

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ---------- Helper: strip markdown bold (biar rapi di widget sederhana) ----------
function clean(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

// ---------- Ambil pengaturan bot ----------
async function getBotSettings(supabaseAdmin: any): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin
    .from("bot_settings")
    .select("key, value");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

// ---------- Ambil katalog produk READY dari database (data ASLI) ----------
async function getCatalog(supabaseAdmin: any): Promise<string> {
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("name, description, price, stock, status")
    .eq("status", "READY")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!products || products.length === 0) {
    return "Tidak ada produk yang tersedia saat ini.";
  }

  return products
    .map((p: any) => {
      const stok =
        p.stock === null ? "stok: tersedia" : `stok: ${p.stock}`;
      const desc = p.description ? ` — ${p.description}` : "";
      return `- ${p.name}${desc} | Rp ${Number(p.price).toLocaleString("id-ID")} | ${stok}`;
    })
    .join("\n");
}

// ---------- Deteksi minta manusia ----------
function wantsHuman(text: string): boolean {
  const t = text.toLowerCase();
  const cues = [
    "mau chat admin",
    "sama admin",
    "ke admin",
    "manusia",
    "cs asli",
    "orang asli",
    "diantar",
    "cod",
    "komplain",
    "rugi",
    "tipu",
    "penipuan",
    "garansi",
    "rusak",
  ];
  return cues.some((c) => t.includes(c));
}

// ---------- Handler ----------
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { visitorId, message } = await req.json();
    if (!visitorId || !message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "visitorId dan message wajib diisi" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ===== 0. Cek bot aktif? =====
    const settings = await getBotSettings(supabaseAdmin);
    if (settings.bot_enabled === "false") {
      return new Response(
        JSON.stringify({
          reply: "Chat assistant sedang nonaktif. Silakan hubungi admin via WhatsApp.",
          escalate: true,
        }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ===== 1. Sesi: cari yang masih ACTIVE, atau buat baru =====
    let sessionId: string | null = null;

    const { data: existing } = await supabaseAdmin
      .from("chat_sessions")
      .select("id, status, escalated")
      .eq("visitor_id", visitorId)
      .order("updated_at", { ascending: false })
      .limit(1);

    let session = existing?.[0];
    if (!session || session.status === "CLOSED") {
      const { data: created, error: createErr } = await ReuseCreate(supabaseAdmin, visitorId);
      if (createErr) throw createErr;
      session = created;
    }
    sessionId = session.id;

    // ===== 2. Simpan pesan user =====
    await supabaseAdmin.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    });

    // ===== 3. Riwayat 12 pesan terakhir (konteks) =====
    const { data: history } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(12);

    const chatHistory = (history ?? []).reverse();

    // ===== 4. Katalog produk ASLI + pengaturan =====
    const catalog = await getCatalog(supabaseAdmin);
    const maxDisc = parseInt(settings.max_discount_percent ?? "10", 10);
    const negoOn = settings.negotiation_enabled !== "false";
    const waAdmin = settings.escalation_whatsapp ?? "6285178965265";
    const persona = settings.bot_persona ?? "Kamu customer service toko online yang ramah.";

    // ===== 5. Eskalasi manual =====
    const escalate = wantsHuman(message);

    // ===== 6. Bangun system prompt ANTI-NGAWUR =====
    const systemText = `${persona}

ATURAN WAJIB (pelanggaran = jawaban salah):
1. Kamu HANYA boleh menyebut produk dan harga dari DAFTAR PRODUK di bawah. Tidak boleh mengarang produk, harga, stok, atau promo apa pun.
2. Jika produk yang ditanya tidak ada di daftar -> jawab jujur belum tersedia. Jangan menawarkan yang mirip kecuali memang ada di daftar.
3. Harga yang tertera tidak boleh diubah. ${negoOn ? `Negosiasi diizinkan: kurbangi maksimal ${maxDisc}% dari harga asli. Kalau diminta di atas ${maxDisc}%, sampaikan bahwa itu di luar wewenangmu dan tawarkan hubungi admin.` : "Negosiasi harga tidak diizinkan. Jika diminta, sampaikan harga sudah fix dan tawarkan hubungi admin untuk penawaran khusus."}
4. Jawab singkat, jelas, bahasa Indonesia santai-sopan. Boleh pakai emoji secukupnya.
5. Untuk keluhan, komplain, barang rusak, atau permintaan bertemu manusia -> minta maaf, lalu arahkan ke admin (nomor WA: ${waAdmin}).
6. Kalau pertanyaannya di luar topik toko (misal kode program, politik), tolak dengan sopan dan arahkan balik ke produk toko.
7. Kamu tidak bisa memproses pembayaran atau pengiriman. Untuk transaksi final, arahkan chat admin.

DAFTAR PRODUK SAAT INI (sumber satu-satunya yang valid):
${catalog}`;

    // ===== 7. Panggil Gemini =====
    let reply: string | null = null;
    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents: chatHistory.map((m: ChatMessage) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: 0.4,   // rendah = konsisten, tidak ngarang
            maxOutputTokens: 400,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts ?? [];
        reply = parts.map((p: any) => p.text ?? "").join("").trim() || null;
      } else {
        console.error("Gemini error:", res.status, await res.text());
      }
    } catch (e) {
      console.error("Gemini fetch failed:", e);
    }

    // Kalau AI gagal total -> fallback jujur + eskalasi
    if (!reply) {
      reply = `Maaf, asisten virtual sedang mengalami gangguan. 😔 Silakan hubungi admin langsung: https://wa.me/${waAdmin}`;
      return new Response(
        JSON.stringify({ reply, escalate: true, waLink: `https://wa.me/${waAdmin}` }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ===== 8. Simpan balasan =====
    await supabaseAdmin.from("chat_messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: reply,
    });

    // Update waktu sesi
    await supabaseAdmin
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    // Kalau minta manusia -> tandai sesi
    if (escalate) {
      await supabaseAdmin
        .from("chat_sessions")
        .update({ escalated: true, status: "ESCALATED" })
        .eq("id", sessionId);
    }

    // ===== 9. Balas ke web =====
    return new Response(
      JSON.stringify({
        reply: clean(reply),
        escalate,
        waLink: `https://wa.me/${waAdmin}`,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("web-chat error:", e);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});

// ---------- Buat sesi baru ----------
async function ReuseCreate(supabaseAdmin: any, visitorId: string) {
  return supabaseAdmin
    .from("chat_sessions")
    .insert({ visitor_id: visitorId, status: "ACTIVE" })
    .select("id, status, escalated")
    .single();
}
