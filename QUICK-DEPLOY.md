# 🚀 ProCheff Vercel Deployment - HIZLI BAŞLANGIÇ

## ⚡ 5 Dakikada Deploy Et!

### 🎯 Adım 1: Vercel'e Git
👉 **Browser'da aç:** https://vercel.com/new

### 🎯 Adım 2: GitHub Repository Seç
1. **Import Git Repository** tıkla
2. **"aydarnuman/ProCheff-New"** repository'yi seç
3. Ayarlar:
   - Framework: **Next.js** ✅ (otomatik)
   - Root Directory: **/** ✅ (default)
   - Build Command: `npm run build` ✅ (default)

### 🎯 Adım 3: Environment Variables Ekle
**Deploy'dan ÖNCE şu variables'ları ekle:**

```
NEXTAUTH_SECRET=I9JU23NF394R6HH58KDMN239F4R6HH32
NODE_ENV=production
```

**Opsiyonel (boş bırakabilirsin):**
```
ANTHROPIC_API_KEY=sk-ant-[senin-key-in]
OPENAI_API_KEY=sk-[senin-key-in]
DATABASE_URL=[postgresql-url-veya-boş]
```

### 🎯 Adım 4: Deploy!
**Deploy** butonuna tıkla ve bekle... ⏳

---

## ✅ Başarı Kontrolü

### 🌐 Live URL'ler:
- **Ana Site:** https://procheff-new.vercel.app
- **Health Check:** https://procheff-new.vercel.app/api/health
- **Dashboard:** https://procheff-new.vercel.app/dashboard

### 🏥 Expected Health Response:
```json
{
  "overall": "healthy",
  "services": [
    {"service": "External API Test", "status": "healthy"},
    {"service": "Database", "status": "healthy"}
  ],
  "environment": "production"
}
```

---

## 🎨 Bonus: Custom Domain (Opsiyonel)

### Domain Bağla (procheff.app):
1. Vercel Dashboard → Project → **Settings** → **Domains**
2. **Add Domain** → `procheff.app` yazıp **Add**
3. DNS Records (domain sağlayıcında):
   ```
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```

---

## 🆘 Sorun Çözme

| Problem | Çözüm |
|---------|--------|
| Build Failed | `npm run build` local'de test et |
| 500 Error | Environment variables kontrol et |
| 404 Error | vercel.json routes kontrol et |
| Slow API | Function timeout artır (vercel.json) |

---

## 🎉 TAMAMLANDI!

**ProCheff artık canlı!** 🌟

🔗 **Site:** https://procheff-new.vercel.app  
📊 **Dashboard:** /dashboard  
📁 **Upload:** /upload  
💼 **İhale:** /ihale  

**Automatic deployments:** Artık `git push origin main` yaptığında otomatik deploy olacak! 🚀