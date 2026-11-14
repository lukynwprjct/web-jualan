#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# DEPLOY WEB-CHAT SAJA (dengan output penuh untuk debug)
# Jalankan: bash ~/luxky-ecommerce/deploy_only.sh
# ============================================================
PROJECT_REF="retpbhcztvthymtluesu"
FUNC_DIR=~/luxky-ecommerce/supabase/functions/web-chat

printf "Paste SUPABASE_ACCESS_TOKEN: "
read -r TOKEN
echo ""

echo "🚀 Deploy web-chat (output lengkap) ..."
echo "----------------------------------------------"
curl -sS -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/deploy?slug=web-chat" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F 'metadata={"entrypoint_path":"index.ts","name":"web-chat","verify_jwt":false};type=application/json' \
  -F "file=@${FUNC_DIR}/index.ts;type=application/octet-stream" \
  -w "\n[HTTP_STATUS: %{http_code}]\n"
echo "----------------------------------------------"
echo ""
echo "📋 Daftar function yang terdaftar:"
curl -sS "https://api.supabase.com/v1/projects/${PROJECT_REF}/functions" \
  -H "Authorization: Bearer ${TOKEN}"
echo ""

# ---------- Set GEMINI_MODEL ----------
echo ""
echo "🔐 Set secret GEMINI_MODEL=gemini-3.5-flash ..."
curl -sS -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[{"name":"GEMINI_MODEL","value":"gemini-3.5-flash"}]'
echo ""

# ---------- Test ----------
echo ""
echo "🧪 Test bot (10 detik tunggu) ..."
sleep 10
curl -sS -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/web-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sb_publishable_ncEocS-7CbRQpX8mhQac-g_NJWEoy43" \
  -d '{"visitorId":"v-test-final","message":"halo, ada produk apa aja?"}'
echo ""
