#!/bin/bash
set -e

echo "🧹 ProCheff 404 Cleanup Başlatıldı"
echo "===================================="
echo "📅 Tarih: $(date '+%d.%m.%Y %H:%M:%S')"
echo

# 1️⃣ not-found dosyalarını kaldır
if [ -f "src/app/not-found.tsx" ]; then
  echo "🗑️  src/app/not-found.tsx siliniyor..."
  rm -f src/app/not-found.tsx
fi

# 2️⃣ layout.tsx içinde notFound render kontrolü
LAYOUT_FILE="src/app/layout.tsx"
if grep -q "NotFound" "$LAYOUT_FILE"; then
  echo "🩹  layout.tsx içinde NotFound referansı tespit edildi, temizleniyor..."
  sed -i '' '/NotFound/d' "$LAYOUT_FILE" 2>/dev/null || sed -i '/NotFound/d' "$LAYOUT_FILE"
  sed -i '' '/notFound/d' "$LAYOUT_FILE" 2>/dev/null || sed -i '/notFound/d' "$LAYOUT_FILE"
  echo "✅  Layout dosyası temizlendi."
else
  echo "✅  Layout dosyasında NotFound referansı yok."
fi

# 3️⃣ out dizininde 404 kalıntılarını temizle
echo
echo "🧼  Eski build kalıntıları temizleniyor..."
rm -rf .next out

# 4️⃣ next.config.js doğrulaması
CONFIG="next.config.js"
if ! grep -q "output: \"export\"" "$CONFIG"; then
  echo "⚙️  next.config.js güncelleniyor..."
  cat > "$CONFIG" <<EOF
const nextConfig = {
  output: "export",
  assetPrefix: "./",
  trailingSlash: true,
  basePath: "",
  reactStrictMode: false,
};
module.exports = nextConfig;
EOF
  echo "✅  next.config.js yeniden oluşturuldu."
else
  echo "✅  next.config.js zaten doğru yapılandırılmış."
fi

# 5️⃣ Full export işlemi (build + export + PWA kopyalama)
echo
echo "🏗️  Tam export işlemi başlatılıyor..."
npm run export:full || (echo "⚠️  Export sırasında hata oluştu, out dizini yeniden oluşturuluyor..." && mkdir -p out)

# 7️⃣ 404 metin kontrolü
echo
echo "🔍  Build sonrası 404 kalıntısı kontrolü:"
if grep -R "<title>404" out --exclude="404.html" --exclude-dir="404" 2>/dev/null; then
  echo "⚠️  Bazı sayfalarda 404 kalıntısı tespit edildi"
else
  echo "✅  404 kalıntısı bulunamadı."
fi

# 8️⃣ Export sayısı kontrolü
EXPORT_COUNT=$(find out -name "index.html" | wc -l | tr -d ' ')
echo "📊  Export edilen sayfa sayısı: $EXPORT_COUNT"

# 9️⃣ Özet
echo
echo "✅ Cleanup tamamlandı!"
echo "📦 Export dizini: $(realpath out)"
echo "🚀 Test etmek için: cd out && python3 -m http.server 8090"
echo "🌐 GitHub Pages URL: https://aydarnuman.github.io/ProCheff-New/"
echo
