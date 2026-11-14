#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# SETUP CHATBOT LUXKY v2 (tanpa Supabase CLI - pakai curl API)
# Jalankan dengan: bash ~/luxky-ecommerce/setup_chatbot2.sh
# ============================================================
set -e

PROJECT_REF="retpbhcztvthymtluesu"
API="https://api.supabase.com/v1/projects/${PROJECT_REF}"
FUNC_DIR=~/luxky-ecommerce/supabase/functions/web-chat

echo "=============================================="
echo "  SETUP CHATBOT LUXKY (v2 - Management API)"
echo "=============================================="

# ---------- 1. Access token ----------
printf "Paste SUPABASE_ACCESS_TOKEN kamu: "
read -r TOKEN
export TOKEN
echo ""

# ---------- 2. Deploy function via Management API ----------
echo "🚀 Deploy edge function web-chat ..."
curl -s -X POST "${API}/functions/deploy?slug=web-chat" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F 'metadata={"entrypoint_path":"index.ts","name":"web-chat","verify_jwt":false};type=application/json' \
  -F "file=@${FUNC_DIR}/index.ts;type=application/octet-stream"

echo ""
echo ""

# ---------- 3. GEMINI_API_KEY ----------
echo "🔑 GEMINI_API_KEY (lihat: grep GEMINI ~/luxky-bot/.env)"
printf "Paste GEMINI_API_KEY kamu: "
read -r GKEY
echo ""

echo "🔐 Simpan secret GEMINI_API_KEY ..."
curl -s -X POST "${API}/secrets" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "[{\"name\":\"GEMINI_API_KEY\",\"value\":\"${GKEY}\"}]"
echo ""
echo ""

# ---------- 4. Test ----------
echo "🧪 Menunggu 5 detik lalu test bot ..."
sleep 5
echo ""
echo "----------------------------------------------"
curl -s -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/web-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sb_publishable_ncEocS-7CbRQpX8mhQac-g_NJWEoy43" \
  -d '{"visitorId":"v-setup-test","message":"halo, ada produk apa aja?"}'
echo ""
echo "----------------------------------------------"
echo ""
echo "🎉 SELESAI! Kalau di atas ada jawaban bot -> chatbot LIVE."
echo "   Test di web: web-jualan-liart.vercel.app (tombol pojok kanan bawah)"
