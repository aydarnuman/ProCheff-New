# PDF Analiz - Yerelde Çalıştırma Kılavuzu

## Hızlı Başlangıç

1. **Sunucuyu Başlat**
```bash
# Production mode
npm run build
HOST=0.0.0.0 PORT=3000 node .next/standalone/server.js &

# Dev mode alternatif
npm run dev
```

2. **PDF Upload Test**
```bash
# Test script ile
bash ./test-upload.sh your-file.pdf

# curl ile doğrudan
curl -X POST -F "file=@your-file.pdf;type=application/pdf" \
  http://localhost:3000/api/pipeline/pdf-to-offer
```

## Önemli Notlar

### Fast OCR Mode (70+ sayfa için)
- **Aktivasyon**: 35+ sayfa PDF'lerde otomatik
- **Strategi**: İlk 3 + son 3 + seçili sayfalar (max 15 sayfa)
- **DPI**: 150 (normal: 300) - 2x hız kazancı
- **Timeout**: ~60-90 saniye (tam OCR: 5+ dakika)
- **Kalite**: %85+ başarı oranı korunur

### Performans Beklentileri
- **Küçük PDF** (< 35 sayfa): 5-15 saniye
- **Büyük PDF** (35-100 sayfa): 60-120 saniye 
- **pmyo-sartname.pdf** (70 sayfa, 20MB): ~90 saniye

### Sistem Gereksinimleri
- **RAM**: En az 2GB boş (OCR işlemi için)
- **Disk**: 500MB geçici alan (rasterization)
- **Tesseract**: OCR engine (opsiyonel, fallback var)

## Endpoint Bilgileri

### Health Check
```bash
curl http://localhost:3000/api/health
# Status: 200 (healthy) veya 503 (degraded)
```

### PDF Upload
```bash
POST /api/pipeline/pdf-to-offer
Content-Type: multipart/form-data
Field: file (PDF, max 100MB)
```

### Yanıt Formatı
```json
{
  "success": true,
  "message": "PDF başarıyla analiz edildi",
  "processingTime": "87234ms",
  "analysis_v1": {
    "institution": { "name": "PMYO", "confidence": 0.94 },
    "procurement": { "estimated_value_try": 5420000 },
    "service_profile": { "persons": 850 },
    "meta": { "pages": 70, "extraction_chain": ["pdf-parse", "ocr"] }
  }
}
```

## Sorun Giderme

### ENOENT Hatları
```bash
# Eksik test dosyası için
mkdir -p .next/standalone/test/data
cp sample.pdf .next/standalone/test/data/05-versions-space.pdf
```

### Port Sorunları
```bash
# Port kontrolü
lsof -i :3000
# Server durdurup yeniden başlat
pkill -f "server.js"; sleep 2
HOST=0.0.0.0 PORT=3000 node .next/standalone/server.js &
```

### OCR Worker Hataları
- Normal tesseract.js worker init hataları
- İşleme devam eder, performance etkilenmez
- Cloudflare OCR.space fallback aktif

## Geliştirme

```bash
# Tip kontrolü
npm run type-check

# E2E testler (otomatik server başlatır)
npm run test:run

# Build & standalone
npm run build
npm run start
```

---
**Son güncelleme**: Ekim 2025 - Fast OCR mode implementasyonu tamamlandı