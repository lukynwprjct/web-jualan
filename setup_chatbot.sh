#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# SETUP CHATBOT LUXKY
# Jalankan dengan: bash ~/luxky-ecommerce/setup_chatbot.sh
#
# Script ini akan:
#   1. Minta SUPABASE_ACCESS_TOKEN (paste sekali)
#   2. Deploy edge function web-chat ke project Supabase
#   3. Minta GEMINI_API_KEY (paste sekali) lalu simpan sebagai secret
#   4. Test panggil edge function
# ============================================================
set -e

PROJECT_REF="retpbhcztvthymtluesu"
FUNCTION_NAME="web-chat"

echo "=============================================="
echo "  SETUP CHATBOT LUXKY STORE"
echo "=============================================="
echo ""

# ---------- 1. Access token ----------
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "✅ Access token sudah ada di environment"
else
  echo "📘 Cara dapat token:"
  echo "   supabase.com/dashboard -> foto profil -> Access Tokens"
  echo "   -> Generate new token -> nama: termux -> Copy"
  echo ""
  printf "Paste SUPABASE_ACCESS_TOKEN kamu: "
  read -r TOKEN
  export SUPABASE_ACCESS_TOKEN="$TOKEN"
fi
echo ""

# ---------- 2. Deploy edge function ----------
echo "🚀 Deploy edge function $FUNCTION_NAME ..."
cd ~/luxky-ecommerce
supabase functions deploy "$FUNCTION_NAME" --project-ref "$PROJECT_REF"
echo "✅ Deploy selesai"
echo ""

# ---------- 3. Gemini API key ----------
echo "🔑 GEMINI_API_KEY (sama dengan yang di ~/luxky-bot/.env)"
printf "Paste GEMINI_API_KEY kamu: "
read -r GKEY
echo ""

echo "🔐 Simpan secret ke Supabase ..."
supabase secrets set GEMINI_API_KEY="$GKEY" --project-ref "$PROJECT_REF"
echo "✅ Secret tersimpan"
echo ""

# ---------- 4. Test ----------
echo "🧪 Test edge function ..."
sleep 3
RESULT=$(curl -s -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sb_publishable_ncEocS-7CbRQpX8mhQac-g_NJWEoy43" \
  -d '{"visitorId":"v-setup-test","message":"halo ada produk apa aja?"}')

echo ""
echo "----------------------------------------------"
echo "Jawaban bot:"
echo "$RESULT"
echo "----------------------------------------------"
echo ""
echo "🎉 SELESAI! Kalau di atas ada jawaban bot, chatbot sudah LIVE."
echo "   Cek di web: web-jualan-liart.vercel.app (tombol bulat pojok kanan bawah)"
