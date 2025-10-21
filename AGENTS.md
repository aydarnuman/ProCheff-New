# ProCheff – Agent Çalışma Kuralları

Bu dosya, aynı anda birden fazla agent (ör. Codex, Claude) çalışırken çakışma ve bozulmayı engellemek için süreç ve kapsam kurallarını tanımlar.

## Kapsam ve Sahiplik
- UI (ör. ihale ekranları): `src/app/ihale`, `src/components` – Sorumlu: UI ekibi (bkz. CODEOWNERS)
- API/Backend: `src/app/api`, `src/lib/ingest` – Sorumlu: Backend ekibi
- Ortak kütüphane: `src/lib` – Sorumlu: Core ekip

Daha derin alt dizinler için daha yakına konan AGENTS.md kuralları önceliklidir.

## Branch ve PR Süreci
- `main` korumalıdır; direkt push yok.
- Her görev için feature branch: `feat/<agent>/<ticket>-kisa`
- PR olmadan merge yok; PR’da tip kontrolü ve build yeşil olmalı.
- CODEOWNERS kapsamındaki dosyalar için ilgili ekipten review şarttır.

## Kilit (Lock) Mekanizması
Aynı dizinde eşzamanlı değişiklik yapmayı engellemek için kilit dosyaları kullanılır.

- Kilit oluştur: `node scripts/lock.js <scopePath> <owner> [ttlDakika=120]`
  - Örn: `node scripts/lock.js src/app/ihale procheff-ui 120`
- Kilit kaldır: `node scripts/unlock.js <scopePath> [owner]`
- Kontrol: `node scripts/check-lock.js <dosya1> <dosya2> ...`

Kilit dosyaları `locks/` altında `path-safe` isimle tutulur ve JSON meta içerir. TTL dolduysa uyarı verir ve geçersiz sayılır.

## Endpoint Kanonikleri
- PDF analizi: `/api/analyze-pdf` (kanonik), `/api/analyze` alias’tır.
- Yeni endpoint eklerken `docs/ROUTES.md` dosyasına not düşülmelidir.

## Gizli Anahtarlar
- .env dosyaları repo dışı tutulur. Örnek için `.env.template` kullanılır.
- Yanlışlıkla paylaşılan anahtarlar DERHAL rotate edilmelidir (OpenAI, Anthropic, Google vb.).

## Biçim ve Tutarlılık
- Prettier/Eslint tercih edilir. PR açmadan önce format ve tip kontrolü çalıştırın.

## İhlaller
- Kilitli kapsamda değişiklik yapan PR’lar red verilir.
- CODEOWNERS kapsamı dışı review’suz merge yapılamaz.

