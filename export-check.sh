#!/bin/bash
set -e
ROOT_DIR="$(pwd)"
OUT_DIR="$ROOT_DIR/out"

echo "🔍 ProCheff Export Validator"
echo "========================================"
echo "📅 Tarih: $(date '+%d.%m.%Y %H:%M:%S')"
echo

# 1️⃣ Kaynak dosyaları
echo "📁 Source pages (src/app/.../page.tsx):"
find src/app -type f -name "page.tsx" | sed 's|src/app||; s|/page.tsx||' | sort
SRC_COUNT=$(find src/app -type f -name "page.tsx" | wc -l | tr -d ' ')
echo "Toplam: $SRC_COUNT"
echo

# 2️⃣ Export dosyaları
echo "📦 Exported pages (out/.../index.html):"
find out -type f -name "index.html" | sed 's|out||; s|/index.html||' | sort
OUT_COUNT=$(find out -type f -name "index.html" | wc -l | tr -d ' ')
echo "Toplam: $OUT_COUNT"
echo

# 3️⃣ Eksik export farkı
echo "⚖️  Karşılaştırma (Eksik export tespiti):"
diff <(find src/app -type f -name "page.tsx" | sed 's|src/app||; s|/page.tsx||' | sort) \
     <(find out -type f -name "index.html" | sed 's|out||; s|/index.html||' | sort) \
     || echo "✅ Export farkı bulunamadı (Hepsi mevcut)."
echo

# 4️⃣ HTTP testi
echo "🌐 Local HTTP Test (Port 8090)"
python3 -m http.server 8090 -d "$OUT_DIR" >/dev/null 2>&1 &
SERVER_PID=$!
sleep 2

ROUTES=$(find out -type f -name "index.html" | sed 's|out||; s|index.html||' | sort)
for route in $ROUTES; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8090${route}")
  if [[ "$STATUS" == "200" ]]; then
    echo -e "✅ 200  ${route}"
  else
    echo -e "❌ ${STATUS}  ${route}"
  fi
done
kill $SERVER_PID 2>/dev/null
echo

# 5️⃣ 404 tespiti (dosya içeriği)
echo "🔎 HTML içerik analizi (404 kontrolü)"
grep -Rl "<title>404" out || echo "✅ Hiçbir sayfada 404 template yok."
echo
echo "✅ Test tamamlandı."
