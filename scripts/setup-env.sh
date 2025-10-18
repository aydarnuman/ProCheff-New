#!/bin/bash

# ProCheff AI - Environment Setup Script
# Bu script .env.local dosyasını otomatik olarak oluşturur

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔐 ProCheff AI - Environment Kurulum Scripti"
echo "=============================================="
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local dosyası zaten mevcut!"
    read -p "Üzerine yazmak istiyor musunuz? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ İşlem iptal edildi."
        exit 1
    fi
    echo "📝 Mevcut dosya yedekleniyor..."
    cp .env.local ".env.local.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy example file
if [ ! -f ".env.example" ]; then
    echo "❌ Hata: .env.example dosyası bulunamadı!"
    exit 1
fi

echo "📋 .env.example dosyasından kopyalanıyor..."
cp .env.example .env.local

echo "✅ .env.local dosyası oluşturuldu!"
echo ""
echo "📝 Şimdi yapmanız gerekenler:"
echo ""
echo "1. .env.local dosyasını bir text editör ile açın:"
echo "   nano .env.local"
echo "   # veya"
echo "   code .env.local"
echo ""
echo "2. ANTHROPIC_API_KEY değerini gerçek API anahtarınız ile değiştirin:"
echo "   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key"
echo ""
echo "3. (İsteğe bağlı) Diğer API anahtarlarını da ekleyin"
echo ""
echo "4. Geliştirme sunucusunu başlatın:"
echo "   npm run dev"
echo ""
echo "📚 Detaylı bilgi için ENV_SETUP.md dosyasına bakın:"
echo "   cat ENV_SETUP.md"
echo ""
echo "🎉 Hazırsınız! İyi çalışmalar!"
