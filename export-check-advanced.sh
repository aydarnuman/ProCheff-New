#!/bin/bash
set -e
ROOT_DIR="$(pwd)"
OUT_DIR="$ROOT_DIR/out"

echo "🔄 ProCheff Auto Rebuild & Export Validator"
echo "============================================="
echo "📅 Tarih: $(date '+%d.%m.%Y %H:%M:%S')"
echo

# 🛠️ Otomatik rebuild seçeneği
if [[ "$1" == "--rebuild" || "$1" == "-r" ]]; then
    echo "🔨 Otomatik rebuild başlatılıyor..."
    echo "1️⃣ Temizlik: .next ve out klasörleri"
    rm -rf .next out
    
    echo "2️⃣ Build: npm run build"
    npm run build
    
    echo "3️⃣ PWA dosyaları kopyalama"
    cp public/sitemap.xml public/robots.txt public/manifest.json public/sw.js out/ 2>/dev/null || true
    
    echo "✅ Rebuild tamamlandı!"
    echo
fi

# Mevcut validator kodu
echo "📁 Source pages (src/app/.../page.tsx):"
find src/app -type f -name "page.tsx" | sed 's|src/app||; s|/page.tsx||' | sort
SRC_COUNT=$(find src/app -type f -name "page.tsx" | wc -l | tr -d ' ')
echo "Toplam: $SRC_COUNT"
echo

echo "📦 Exported pages (out/.../index.html):"
find out -type f -name "index.html" | sed 's|out||; s|/index.html||' | sort
OUT_COUNT=$(find out -type f -name "index.html" | wc -l | tr -d ' ')
echo "Toplam: $OUT_COUNT"
echo

echo "⚖️  Karşılaştırma (Route grup analizi):"
DIFF_OUTPUT=$(diff <(find src/app -type f -name "page.tsx" | sed 's|src/app||; s|/page.tsx||' | sort) \
                   <(find out -type f -name "index.html" | sed 's|out||; s|/index.html||' | sort) 2>/dev/null || true)

if [[ -z "$DIFF_OUTPUT" ]]; then
    echo "✅ Tam eşleşme - hiçbir fark yok"
else
    echo "📝 Route grup dönüşümleri tespit edildi:"
    echo "$DIFF_OUTPUT" | grep -E "^[<>]" | while read line; do
        if [[ "$line" =~ "/(admin)/" ]]; then
            echo "🔄 Route grup: $line"
        elif [[ "$line" =~ "/404" ]]; then
            echo "🆔 Otomatik 404: $line"
        else
            echo "⚠️  Beklenmeyen: $line"
        fi
    done
fi
echo

echo "🌐 HTTP Test Başlatılıyor (Port 8091)..."
python3 -m http.server 8091 -d "$OUT_DIR" >/dev/null 2>&1 &
SERVER_PID=$!
sleep 3

SUCCESS_COUNT=0
ERROR_COUNT=0
ROUTES=$(find out -type f -name "index.html" | sed 's|out||; s|index.html||' | sort)

for route in $ROUTES; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8091${route}" 2>/dev/null || echo "000")
    if [[ "$STATUS" == "200" ]]; then
        echo -e "✅ 200  ${route}"
        ((SUCCESS_COUNT++))
    else
        echo -e "❌ ${STATUS}  ${route}"
        ((ERROR_COUNT++))
    fi
done

kill $SERVER_PID 2>/dev/null
echo
echo "📊 Test Sonucu:"
echo "✅ Başarılı: $SUCCESS_COUNT"
echo "❌ Hatalı: $ERROR_COUNT"
echo "📈 Başarı oranı: $(( SUCCESS_COUNT * 100 / (SUCCESS_COUNT + ERROR_COUNT) ))%"

echo
echo "🔎 İçerik Analizi:"
if grep -Rq "404.*could not be found" out --exclude="404.html" --exclude-dir="404" 2>/dev/null; then
    echo "⚠️  Bazı sayfalarda 404 template tespit edildi:"
    grep -Rl "404.*could not be found" out --exclude="404.html" --exclude-dir="404" 2>/dev/null | head -3
else
    echo "✅ Tüm sayfalar düzgün render edilmiş"
fi

echo
if [[ $ERROR_COUNT -eq 0 ]]; then
    echo "🎉 TÜM TESTLER BAŞARILI!"
    echo "🚀 Site deploy için hazır: https://aydarnuman.github.io/ProCheff-New/"
else
    echo "⚠️  $ERROR_COUNT hata tespit edildi - düzeltme gerekli"
    exit 1
fi
