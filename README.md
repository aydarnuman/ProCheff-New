# 🧑‍🍳 ProCheff AI - Türkçe İnteraktif Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-blue)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**ProCheff AI** - Yapay zeka destekli menü analizi ve fiyatlandırma platformu. Tamamen Türkçe arayüz ile gelişmiş restoran yönetim sistemi.

## ✨ Özellikler

### 🎯 Ana Dashboard
- 🧑‍🍳 **Türkçe Kontrol Paneli** - Kullanıcı dostu arayüz
- 🔍 **Gerçek Zamanlı Arama** - Özellikleri anında ara ve filtrele
- 📊 **İnteraktif Kartlar** - Hover efektleri ile dinamik UI
- ⚡ **Canlı Metrikler** - Aktif kullanıcı, API yanıt süresi, sistem yükü

### 🤖 AI Özellikler
- **Menü Analizi** - AI destekli otomatik menü değerlendirmesi
- **Piyasa Verileri** - Gerçek zamanlı fiyat takibi
- **Akıllı Öneriler** - Kârlılık ve maliyet optimizasyonu
- **Trend Analizi** - Pazar trendleri ve tahminler

### 🎨 Teknik Özellikler
- ✅ **Pure Inline Styles** - Sıfır external CSS dependency
- 📱 **Responsive Design** - Mobil ve desktop uyumlu
- 🔄 **React Hooks** - Modern state yönetimi
- 🚫 **Hata Ayıklama** - Hydration error'ları çözülmüş
- 🌟 **Smooth Animasyonlar** - Micro-interactions

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ 
- npm veya yarn

### Kurulum

```bash
# Repository'yi klonla
git clone https://github.com/aydarnuman/ProCheff-New.git
cd ProCheff-New

# Bağımlılıkları yükle
npm install

# Environment dosyasını oluştur
cp .env.example .env.local
# .env.local dosyasını düzenleyerek API anahtarlarınızı ekleyin

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışmaya başlayacak.

### ⚙️ Environment Variables

Uygulama çalışması için gerekli ortam değişkenleri:

**Zorunlu:**
- `ANTHROPIC_API_KEY` - Claude AI API anahtarı ([Buradan alın](https://console.anthropic.com/))

**İsteğe Bağlı:**
- `OPENAI_API_KEY` - OpenAI API anahtarı
- `NEXTAUTH_SECRET` - Authentication için secret key
- `DB_URL_SECRET` - Veritabanı bağlantı URL'i
- `NODE_ENV` - Ortam tipi (development/production)
- `PORT` - Server portu (varsayılan: 8080)

Detaylı bilgi için `.env.example` dosyasına bakın.

## 📱 Demo Screenshots

### Ana Dashboard
![ProCheff AI Dashboard](https://via.placeholder.com/800x400/1A1B23/10B981?text=ProCheff+AI+Dashboard)

### Arama ve Filtre
![Search and Filter](https://via.placeholder.com/800x400/1A1B23/3B82F6?text=Search+%26+Filter+System)

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Pure Inline Styles (Tailwind kaldırıldı)
- **State Management:** React Hooks
- **API:** Next.js API Routes
- **Deployment:** Cloud Run, GitHub Actions

## 📊 Sistem Durumu

- ✅ **Menü Analizi** - AI destekli analiz sistemi
- ✅ **Piyasa Verileri** - Gerçek zamanlı veri toplama
- ✅ **Design System v1.1.0** - Türkçe UI komponentleri
- ⚡ **API Servisleri** - Yüksek performans

## 🌍 Lokalizasyon

Uygulama tamamen **Türkçe** olarak geliştirilmiştir:
- 🇹🇷 %100 Türkçe arayüz
- 📋 Türkçe komponent prop'ları (`varyant`, `boyut`, `genislik`)
- 🗣️ Türkçe kullanıcı mesajları
- 🏷️ Türkçe durum açıklamaları

## 🔧 Geliştirme

### Proje Yapısı
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API endpoints
│   ├── page.tsx        # Ana sayfa
│   └── layout.tsx      # Layout wrapper
├── components/         
│   └── ui/             # UI komponentleri
│       ├── Button.tsx
│       ├── FeatureCard.tsx
│       └── Modal.tsx
└── lib/                # Utility fonksiyonlar
```

### Mevcut Komponentler
- **Button** - Türkçe props ile çok amaçlı buton
- **FeatureCard** - İnteraktif özellik kartları
- **Modal** - ESC desteği ile modal pencere

### API Endpoints
- `/api/menu/analyze` - Menü analizi
- `/api/market/prices` - Piyasa fiyatları
- `/api/health` - Sistem sağlığı

## 🚀 Production Deployment

### Cloud Run (Recommended)
```bash
# Deploy script
./scripts/deploy.sh
```

### Manual Deployment
```bash
# Build için
npm run build

# Production start
npm start
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📈 Roadmap

- [ ] **Gelişmiş AI Analizi** - Daha detaylı menü önerileri
- [ ] **Çoklu Dil Desteği** - İngilizce ve diğer diller
- [ ] **Dark/Light Mode** - Tema değiştirme
- [ ] **Gerçek Zamanlı Bildirimler** - WebSocket entegrasyonu
- [ ] **Export Özelliği** - PDF/Excel rapor çıktısı
- [ ] **Kullanıcı Rolleri** - Admin/User yetki sistemi

## 📄 Lisans

Bu proje [MIT](LICENSE) lisansı ile lisanslanmıştır.

## 👨‍💻 Geliştirici

**Numan Aydar** - [@aydarnuman](https://github.com/aydarnuman)

---

⭐ Bu projeyi beğendiyseniz yıldızlamayı unutmayın!