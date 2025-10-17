# ProCheff-New — Sprint 0 Başlangıç

Kurumsal AI menü zekâsı altyapısı.  
Next.js 14 + TypeScript + Cloud Run + GitHub Actions pipeline.

## Geliştirme

```bash
npm ci
npm run dev
```

## Üretim

Git push → main → Cloud Run deploy  
Manuel: `./scripts/deploy.sh`

## Sağlık Kontrolü

`/api/health` → 200 OK

---

## ✅ Son Adım

Kaydet → Terminalde:

```bash
git add .
git commit -m "chore: initialize Sprint0 structure"
git push origin main
```
