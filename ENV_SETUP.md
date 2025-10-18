# 🔐 ProCheff AI - Environment Variables Kurulum Rehberi

Bu rehber, ProCheff AI uygulaması için gerekli ortam değişkenlerinin (environment variables) nasıl kurulacağını adım adım açıklar.

## 📋 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Gerekli API Anahtarları](#gerekli-api-anahtarları)
3. [İsteğe Bağlı Değişkenler](#isteğe-bağlı-değişkenler)
4. [Ortama Göre Kurulum](#ortama-göre-kurulum)
5. [Sorun Giderme](#sorun-giderme)

---

## 🚀 Hızlı Başlangıç

### 1. Environment Dosyası Oluşturma

```bash
# Proje dizinine gidin
cd ProCheff-New

# Örnek dosyayı kopyalayın
cp .env.example .env.local

# Dosyayı favori editörünüzde açın
nano .env.local
# veya
code .env.local
```

### 2. Minimum Gereksinimler

En az aşağıdaki değişkeni ayarlamanız gerekir:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-api-key-here
```

### 3. Uygulamayı Başlatma

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışmaya başlayacak.

---

## 🔑 Gerekli API Anahtarları

### Anthropic Claude API (ZORUNLU)

ProCheff AI, menü analizi ve AI özellikleri için Anthropic Claude API'sini kullanır.

#### API Key Alma Adımları:

1. **Anthropic Console'a gidin**: https://console.anthropic.com/
2. **Hesap oluşturun** veya giriş yapın
3. **API Keys** bölümüne gidin
4. **Create Key** butonuna tıklayın
5. Key'i kopyalayın ve `.env.local` dosyanıza ekleyin:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxx
```

#### Önemli Notlar:
- ✅ Free tier kullanabilirsiniz (sınırlı kullanım)
- ✅ API key'i başında `sk-ant-api03-` olmalı
- ❌ Key'i asla GitHub'a commit etmeyin
- ⚠️ Key'i güvenli bir yerde saklayın

---

## 🔧 İsteğe Bağlı Değişkenler

### OpenAI API Key

Ek AI özellikleri için OpenAI entegrasyonu (isteğe bağlı):

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Nasıl alınır:**
1. https://platform.openai.com/ adresine gidin
2. API Keys bölümüne gidin
3. Yeni key oluşturun

### NextAuth Secret

Authentication özellikleri için güvenlik anahtarı:

```bash
NEXTAUTH_SECRET=your-random-secret-here
```

**Nasıl oluşturulur:**
```bash
# Linux/MacOS
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Database URL

Veritabanı bağlantısı için connection string:

```bash
DB_URL_SECRET=postgresql://username:password@localhost:5432/procheff
```

**Format:**
```
protocol://username:password@host:port/database
```

---

## 🌍 Ortama Göre Kurulum

### Development (Yerel Geliştirme)

Dosya: `.env.local`

```bash
# Development için minimum config
ANTHROPIC_API_KEY=sk-ant-api03-xxxx
NODE_ENV=development
PORT=3000
```

### Test (Test Ortamı)

Dosya: `.env.test`

```bash
# Test için config
ANTHROPIC_API_KEY=test-key-mock
NEXTAUTH_SECRET=test-secret-mock
NODE_ENV=test
```

### Production (Üretim Ortamı)

⚠️ **Production'da dosya kullanmayın!**

Hosting sağlayıcınızın environment variable yönetimini kullanın:

#### Vercel
1. Vercel Dashboard'a gidin
2. Projenizi seçin
3. Settings → Environment Variables
4. Her değişkeni ekleyin

#### GitHub Actions
`.github/workflows/deploy.yml` içinde:
```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  NODE_ENV: production
```

#### Docker
```bash
docker run -e ANTHROPIC_API_KEY=sk-ant-api03-xxxx procheff
```

---

## 🐛 Sorun Giderme

### Problem: "ENV_INVALID: ANTHROPIC_API_KEY: Required"

**Sebep:** API key tanımlanmamış veya geçersiz.

**Çözüm:**
```bash
# .env.local dosyasını kontrol edin
cat .env.local | grep ANTHROPIC_API_KEY

# Boş veya yoksa, ekleyin
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-key" >> .env.local
```

### Problem: "ANTHROPIC_API_KEY: String must contain at least 5 character(s)"

**Sebep:** API key çok kısa veya boş.

**Çözüm:**
```bash
# Geçerli bir Anthropic API key girin (sk-ant-api03- ile başlamalı)
ANTHROPIC_API_KEY=sk-ant-api03-complete-valid-key-here
```

### Problem: Environment değişkenleri yüklenmiyor

**Çözüm 1:** Dosya adını kontrol edin
```bash
# Doğru: .env.local
# Yanlış: env.local veya .env
ls -la | grep env
```

**Çözüm 2:** Server'ı yeniden başlatın
```bash
# Development server'ı durdurun (Ctrl+C)
# Tekrar başlatın
npm run dev
```

**Çözüm 3:** Node modules cache'i temizleyin
```bash
npm run clean
npm install
npm run dev
```

### Problem: "Cannot find module 'dotenv'"

**Sebep:** Next.js otomatik olarak .env dosyalarını yükler, `dotenv` paketi gerekmez.

**Çözüm:** Herhangi bir `require('dotenv')` satırını kaldırın.

---

## 📚 Ek Kaynaklar

- [Next.js Environment Variables Docs](https://nextjs.org/docs/basic-features/environment-variables)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Environment Variable Security Best Practices](https://blog.gitguardian.com/secrets-api-management/)

---

## ✅ Checklist

Kurulumunuzun tamamlandığını doğrulamak için:

- [ ] `.env.local` dosyası oluşturuldu
- [ ] `ANTHROPIC_API_KEY` ayarlandı ve geçerli
- [ ] `.env.local` dosyası `.gitignore`'da (varsayılan olarak zaten var)
- [ ] `npm run dev` çalışıyor
- [ ] Uygulama http://localhost:3000 adresinde açılıyor
- [ ] AI özellikleri çalışıyor (menü analizi vb.)

---

## 🆘 Yardım

Hala sorun yaşıyorsanız:

1. **Logs'a bakın:**
   ```bash
   npm run dev 2>&1 | tee debug.log
   ```

2. **Environment'ı test edin:**
   ```bash
   node -e "console.log(require('dotenv').config({path: '.env.local'}))"
   ```

3. **Issue açın:** [GitHub Issues](https://github.com/aydarnuman/ProCheff-New/issues)

---

**Son güncelleme:** 2025-10-18
