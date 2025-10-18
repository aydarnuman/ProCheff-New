# ProCheff Development Guide

## 🚀 Hızlı Başlangıç

### Geliştirme Sunucusu
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run type-check   # TypeScript kontrolü
```

### 📁 Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard grubu
│   ├── (admin)/          # Admin grubu
│   ├── api/              # API endpoints
│   └── globals.css       # Global stiller
├── components/           # React bileşenleri
│   ├── ui/              # Temel UI bileşenleri
│   ├── dashboard/       # Dashboard bileşenleri
│   └── layout/          # Layout bileşenleri
├── lib/                 # Utilities ve core logic
│   ├── market/         # Market entegrasyonları
│   ├── menu/           # Menü analiz sistemi
│   ├── offer/          # Teklif hesaplama
│   ├── reasoning/      # AI reasoning engine
│   └── utils/          # Genel utilities
└── types/              # TypeScript type definitions
```

## 🛠 Geliştirme İpuçları

### 1. API Endpoint Geliştirme
- Her endpoint `src/app/api/` altında
- `route.ts` dosyası kullan
- Type safety için `src/types/` kullan

### 2. Market Entegrasyonları
- `src/lib/market/adapters/` altında yeni market ekle
- `src/lib/market/core/types.ts` tiplerini güncelle
- `src/lib/market/core/aggregator.ts` ile entegre et

### 3. UI Bileşenleri
- `src/components/ui/` temel bileşenler
- Tailwind CSS kullan
- Responsive design uygula

### 4. State Management
- Zustand kullanıyoruz
- `src/lib/store.ts` ana store
- Component bazlı local state'ler

## 🔧 Debugging

### VS Code Debug Config
F5 ile debug başlat veya:
- Next.js server debug
- API endpoint debug
- TypeScript compile debug

### Logging
- `src/lib/utils/logger.ts` kullan
- Console.log yerine structured logging
- Environment based log levels

## 🧪 Testing

### API Testing
- `.vscode/api-tests.http` dosyasını kullan
- REST Client extension ile test et
- Postman collection export/import

### Manual Testing
- `npm run dev` ile local server
- Browser DevTools kullan
- Network tab ile API monitoring

## 📊 Performance

### Bundle Analysis
```bash
npm run build
# Bundle analyzer ile check et
```

### Database Queries
- Query optimization
- Connection pooling
- Cache strategies

## 🔒 Security

### Environment Variables

#### Kurulum
1. `.env.example` dosyasını `.env.local` olarak kopyalayın:
   ```bash
   cp .env.example .env.local
   ```

2. `.env.local` dosyasını düzenleyin ve gerçek API anahtarlarınızı girin:
   ```bash
   # Zorunlu
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key
   
   # İsteğe bağlı
   OPENAI_API_KEY=sk-your-actual-key
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   ```

3. Environment dosyasını test edin:
   ```bash
   npm run dev
   ```

#### Güvenlik Kuralları
- ✅ `.env.local` kullan (development için)
- ✅ `.env.production` kullan (production için)
- ❌ `.env` dosyalarını Git'e commit etme
- ❌ API keys'leri kod içine hard-code etme
- ✅ Production'da hosting sağlayıcısının environment variable yönetimini kullan

#### Desteklenen Environment Variables

| Değişken | Zorunlu | Varsayılan | Açıklama |
|----------|---------|-----------|----------|
| `ANTHROPIC_API_KEY` | ✅ Evet | - | Claude AI API anahtarı |
| `OPENAI_API_KEY` | ❌ Hayır | - | OpenAI API anahtarı |
| `NEXTAUTH_SECRET` | ❌ Hayır | - | Authentication secret |
| `DB_URL_SECRET` | ❌ Hayır | - | Database connection URL |
| `NODE_ENV` | ❌ Hayır | `production` | development/test/production |
| `PORT` | ❌ Hayır | `8080` | Server port numarası |

### API Security
- Rate limiting aktif
- Input validation
- CORS ayarları

## 🌍 Deployment

### Vercel (Önerilen)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t procheff .
docker run -p 3000:3000 procheff
```

## 📈 Monitoring

### Error Tracking
- Built-in error boundaries
- API error logging
- User experience tracking

### Performance Monitoring
- Core Web Vitals
- API response times
- Database query performance
