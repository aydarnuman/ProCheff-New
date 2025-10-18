# 🚀 ProCheff AI - Hızlı Başlangıç Rehberi

5 dakikada ProCheff AI'yi çalıştırın!

## 📦 Adım 1: Proje Kurulumu

```bash
# Repository'yi klonlayın
git clone https://github.com/aydarnuman/ProCheff-New.git
cd ProCheff-New

# Bağımlılıkları yükleyin
npm install
```

## 🔐 Adım 2: Environment Dosyasını Oluşturun

### Otomatik Kurulum (Önerilen)

```bash
# Linux/MacOS
npm run setup:env

# Windows
scripts\setup-env.bat
```

### Manuel Kurulum

```bash
# .env.local dosyasını oluşturun
cp .env.example .env.local

# Editörde açın
nano .env.local
# veya
code .env.local
```

## 🔑 Adım 3: API Anahtarı Alın

1. **Anthropic Console'a gidin**: https://console.anthropic.com/
2. Hesap oluşturun veya giriş yapın
3. **API Keys** → **Create Key**
4. API key'i kopyalayın

## ✏️ Adım 4: API Anahtarını Ekleyin

`.env.local` dosyasını açın ve şu satırı bulun:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-api-key-here
```

`your-api-key-here` kısmını kopyaladığınız gerçek API key ile değiştirin:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Dosyayı kaydedin.

## ▶️ Adım 5: Uygulamayı Başlatın

```bash
npm run dev
```

Tarayıcınızda açın: **http://localhost:3000**

## ✅ Tamamlandı!

Şimdi ProCheff AI'yi kullanmaya hazırsınız! 🎉

---

## 🆘 Sorun mu Yaşıyorsunuz?

### "ENV_INVALID: ANTHROPIC_API_KEY: Required" hatası alıyorum

**Çözüm:**
```bash
# .env.local dosyasının olduğunu kontrol edin
ls -la .env.local

# Yoksa oluşturun
cp .env.example .env.local

# API key'in doğru girildiğini kontrol edin
cat .env.local | grep ANTHROPIC_API_KEY
```

### Uygulama başlamıyor

**Çözüm:**
```bash
# Port 3000 kullanımda olabilir
# Farklı port kullanın
PORT=3001 npm run dev
```

### API çalışmıyor

**Çözüm:**
1. API key'in doğru olduğundan emin olun
2. Anthropic hesabınızda kredi olduğundan emin olun
3. Server'ı yeniden başlatın (Ctrl+C sonra npm run dev)

---

## 📚 Daha Fazla Bilgi

- **Detaylı Environment Kurulum**: [ENV_SETUP.md](ENV_SETUP.md)
- **Geliştirme Rehberi**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **Proje Dokümantasyonu**: [README.md](README.md)

---

## 💡 İpuçları

- ✅ `.env.local` dosyasını Git'e commit etmeyin (zaten .gitignore'da)
- ✅ Production'da environment variables'ı hosting sağlayıcınızda ayarlayın
- ✅ Farklı ortamlar için farklı dosyalar kullanın (`.env.development`, `.env.production`)
- ✅ Sensitive bilgileri asla kod içine yazmayın

---

**Keyifli kodlamalar! 🧑‍🍳**
