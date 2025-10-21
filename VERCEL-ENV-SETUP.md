# Vercel Environment Variables Kurulum

## 📋 Vercel Dashboard'da Ayarlanacak Environment Variables

Vercel Dashboard → Settings → Environment Variables kısmına şu değerleri ekle:

### 🔐 Temel Secrets
| Key | Example Value | Açıklama |
|-----|---------------|----------|
| `NEXTAUTH_SECRET` | `I9JU23NF394R6HH58KDMN239F4R6HH32` | NextAuth için 32 karakter rastgele string |
| `NODE_ENV` | `production` | Sabit değer |

### 🤖 AI API Keys
| Key | Example Value | Açıklama |
|-----|---------------|----------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Claude API key'in (opsiyonel) |
| `OPENAI_API_KEY` | `sk-...` | OpenAI API key (opsiyonel) |

### 🗄️ Database (Opsiyonel)
| Key | Example Value | Açıklama |
|-----|---------------|----------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | PostgreSQL bağlantısı (boş bırakabilirsin) |

### 🔧 GitHub Actions Secrets (Eğer CI/CD kullanılacaksa)
| Key | Example Value | Açıklama |
|-----|---------------|----------|
| `VERCEL_ORG_ID` | `team_...` | Vercel Team ID |
| `VERCEL_PROJECT_ID` | `prj_...` | Vercel Project ID |
| `VERCEL_TOKEN` | `...` | Vercel Deploy Token |

## 🚀 Deploy Adımları

### 1. Vercel'e Connect
```bash
# Vercel CLI kurulumu (opsiyonel)
npm i -g vercel

# Projeyi Vercel'e bağla
vercel --prod
```

### 2. Environment Variables Ekle
- Vercel Dashboard → Project → Settings → Environment Variables
- Yukarıdaki tablodan gerekli değerleri ekle

### 3. Deploy
```bash
# Manuel deploy (opsiyonel - otomatik de yapar)
vercel --prod

# Veya sadece git push
git push origin main
```

## 🌍 Domain Setup (procheff.app)

### 1. Vercel'de Domain Ekle
- Vercel → Project → Settings → Domains  
- "Add Domain" → `procheff.app`

### 2. DNS Kayıtları
Domain sağlayıcında şu kayıtları ekle:

| Tip | Ad | Değer |
|-----|-----|-------|
| A | @ | `76.76.21.21` |
| CNAME | www | `cname.vercel-dns.com` |

### 3. SSL
- Otomatik olarak SSL sertifikası oluşturulur
- `https://procheff.app` aktif hale gelir

## ✅ Test Endpoints

Deploy sonrası test edilecek URL'ler:

- Health Check: `https://procheff-new.vercel.app/api/health`
- Dashboard: `https://procheff-new.vercel.app/dashboard`
- Upload: `https://procheff-new.vercel.app/upload`

## 📊 Expected Response

Health endpoint'ten beklenen yanıt:
```json
{
  "overall": "healthy",
  "services": [
    {"service": "External API Test", "status": "healthy"},
    {"service": "Database", "status": "healthy"}
  ],
  "uptime": "...",
  "version": "1.1.0",
  "environment": "production"
}
```

## 🎯 Production Ready Checklist

- [ ] Environment variables eklendi
- [ ] Deploy başarılı
- [ ] Health check geçiyor
- [ ] Domain aktif (opsiyonel)
- [ ] SSL çalışıyor
- [ ] Dashboard erişilebilir