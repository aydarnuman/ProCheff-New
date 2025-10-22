# OCR.space PRO PLAN - Kurulum ve Kullanım Rehberi

## 🎉 Tebrikler! Pro Plan Satın Aldınız

Pro plan ile sistem çok daha hızlı ve güçlü hale geldi:

### ✅ Pro Plan Avantajları
- **Dosya boyutu**: 50MB'a kadar (vs 5MB free)  
- **İşlem hızı**: Daha hızlı Pro sunucular
- **API limiti**: 500+ istek/gün (vs 25 free)
- **Öncelikli destek**: Daha hızlı yanıt

## 🔑 Pro API Key Alma

1. **OCR.space hesabınıza gidin**: https://ocr.space/ocrapi
2. **Pro plan dashboard'ınızda yeni API key'inizi alın**
3. **Sistem ortam değişkenini güncelleyin**:

```bash
export OCR_SPACE_API_KEY="YOUR_NEW_PRO_API_KEY"
echo 'export OCR_SPACE_API_KEY="YOUR_NEW_PRO_API_KEY"' >> ~/.bashrc
```

## 🚀 Beklenen Performans

### 70 Sayfalık PDF (20MB) İçin:
- **Pro Plan**: 5-15 saniye (direkt işlem)
- **Free Plan**: 30-60 saniye (sayfa bölme)
- **Local OCR**: 90+ saniye

### Test Komutu:
```bash
cd /home/codespace/ProCheff-New
time curl -s -X POST -F "file=@pmyo-sartname.pdf;type=application/pdf" \
  http://localhost:3000/api/pipeline/pdf-to-offer
```

## 🛠️ Sistem Optimizasyonları

Sistem otomatik olarak şunları yapar:

1. **API key uzunluğunu kontrol eder** (Pro keys daha uzun)
2. **Dosya boyut limitini ayarlar** (Pro: 45MB, Free: 4MB)
3. **Pro plan için direkt işlem yapar** 
4. **Gerekirse sayfa bölme stratejisine geçer**

## 📊 Monitoring

Pro plan kullanımını takip etmek için:

```bash
# API kullanım istatistikleri
curl -H "apikey: YOUR_PRO_KEY" \
     https://api.ocr.space/parse/getusage

# Test performance  
time curl -s -X POST \
  -H "apikey: YOUR_PRO_KEY" \
  -F "file=@large-pdf.pdf" \
  https://api.ocr.space/parse/image
```

## 🎯 Pratik Kullanım

### Büyük Dosyalar (20MB+):
- ✅ Direkt upload (Pro)
- ✅ 5-15 saniye işlem süresi
- ✅ Yüksek kalite OCR

### Çok Büyük Dosyalar (50MB+):
- ✅ Otomatik sayfa bölme
- ✅ İlk sayfalar hızlı işlenir
- ✅ Early stopping ile optimizasyon

## 🔧 Troubleshooting

### Hala "File too large" hatası alıyorsanız:
1. Yeni Pro API key'i aldığınızdan emin olun
2. Sistem ortam değişkenini güncelleyin
3. Server'ı yeniden başlatın

### Performance beklentilerin altındaysa:
1. İnternet bağlantınızı kontrol edin
2. OCR.space server durumunu kontrol edin
3. Pro plan hesap durumunu kontrol edin

---

**🎉 Artık 70 sayfalık PDF'ler için praktik çözümünüz hazır!**

*Sistem Pro plan özelliklerini otomatik algılayıp en iyi performansı verecek şekilde optimize edilmiştir.*