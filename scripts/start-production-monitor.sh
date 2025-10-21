#!/bin/bash

# ProCheff PDF Production Monitor - Start Script
echo "🚀 ProCheff PDF Production Monitor Başlatılıyor..."

# Check if server is running
echo "🔍 Sunucu kontrolü yapılıyor..."
if ! curl -s http://localhost:3000/api/monitoring/pdf-health-check > /dev/null; then
    echo "❌ Sunucu çalışmıyor! Önce Next.js uygulamasını başlatın:"
    echo "   npm run dev"
    exit 1
fi

echo "✅ Sunucu çalışıyor"

# Create logs directory
mkdir -p logs

# Run smart tests first
echo "🧪 Smart PDF test sistemi çalıştırılıyor..."
node scripts/smart-pdf-tests.js

TEST_EXIT_CODE=$?

# Start monitoring if tests are mostly successful
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Testler başarılı - Production monitor başlatılıyor..."
    
    # Check if PM2 is available
    if command -v pm2 &> /dev/null; then
        echo "📦 PM2 ile production monitor başlatılıyor..."
        pm2 start scripts/production-monitor.js --name "procheff-pdf-monitor" --watch false
        pm2 logs procheff-pdf-monitor --lines 20
    else
        echo "📦 PM2 bulunamadı - Direct node ile başlatılıyor..."
        echo "   Durdurmak için Ctrl+C kullanın"
        node scripts/production-monitor.js
    fi
else
    echo "⚠️ Testler kısmen başarısız ama monitoring başlatılıyor..."
    echo "📋 Test raporunu inceleyin: reports/ dizini"
    
    # Start monitoring anyway but with warnings
    if command -v pm2 &> /dev/null; then
        pm2 start scripts/production-monitor.js --name "procheff-pdf-monitor" --watch false
        pm2 logs procheff-pdf-monitor --lines 10
    else
        node scripts/production-monitor.js
    fi
fi