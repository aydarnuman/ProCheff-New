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
- `.env.local` kullan
- Sensitive data GitHub'a commit etme
- API keys secure storage

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
