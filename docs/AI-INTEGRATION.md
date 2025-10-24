# 🤖 ProCheff AI Integration Guide

## Overview

ProCheff projesi, GitHub Issues üzerinden AI yardım sistemi entegrasyonuna sahiptir. Bu doküman, AI yardım sisteminin nasıl kullanılacağını ve yapılandırılacağını açıklar.

## ✨ Features

### Mevcut Özellikler
- ✅ **Yapılandırılmış AI Talepleri** - GitHub Issue template ile standartlaştırılmış talepler
- ✅ **Otomatik Etiketleme** - `ai-assistance` etiketi ile otomatik kategorizasyon
- ✅ **Talep Tipleri** - Kod üretimi, review, dokümantasyon, bug analizi, özellik önerileri
- ✅ **İzlenebilirlik** - GitHub Issues üzerinden takip ve raporlama

### Geliştirme Aşamasındaki Özellikler
- 🔄 **GitHub Actions Entegrasyonu** - Otomatik AI yanıtları
- 🔄 **OpenAI API Bağlantısı** - GPT modelleri ile entegrasyon
- 🔄 **Anthropic Claude Entegrasyonu** - Claude API entegrasyonu
- 🔄 **Webhook Sistemi** - Gerçek zamanlı AI yardımı
- 🔄 **Özel Bot** - ProCheff AI Assistant

## 📋 How to Use

### 1. AI Yardım Talebi Oluşturma

GitHub repository'de yeni bir issue oluşturun ve "AI Assistance Request" template'ini seçin:

1. Repository'ye gidin: https://github.com/aydarnuman/ProCheff-New
2. "Issues" sekmesine tıklayın
3. "New issue" butonuna tıklayın
4. "🤖 AI Assistance Request" template'ini seçin
5. Formu doldurun:
   - AI Request Type seçin (Code generation, Review, vb.)
   - Description alanına detaylı açıklama yazın
   - Context'i ekleyin (ilgili dosyalar, kod parçaları)
   - Expected Output belirtin
   - Acceptance Criteria tanımlayın

### 2. Talep Tipleri

#### Code Generation (Kod Üretimi)
```markdown
## AI Request Type
- [x] Code generation

## Description
Yeni bir menü analizi bileşeni oluşturulması gerekiyor.

## Context
- Mevcut bileşenler: src/components/analysis/
- Kullanılacak API: /api/menu-analysis
- Gerekli özellikler: Türkçe UI, responsive design
```

#### Code Review
```markdown
## AI Request Type
- [x] Code review

## Description
src/app/ihale/page.tsx dosyasının kod kalitesi review'ü.

## Context
- Performans iyileştirmeleri
- TypeScript tip güvenliği
- Best practices kontrolü
```

#### Documentation
```markdown
## AI Request Type
- [x] Documentation

## Description
API endpoint'leri için kapsamlı dokümantasyon.

## Context
- src/app/api/ altındaki tüm route'lar
- OpenAPI/Swagger formatında
```

### 3. AI Yanıt Alma

AI sistemi issue'yu işledikten sonra:
1. Issue'ya yorum olarak yanıt ekler
2. İlgili etiketleri günceller
3. Gerekirse kod önerileri içeren PR açar
4. Dokümantasyon dosyaları oluşturur

## 🔧 Configuration

### Environment Variables

AI entegrasyonu için gerekli environment variable'lar:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.7

# Anthropic Claude Configuration
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229

# GitHub Configuration
GITHUB_TOKEN=ghp_...
GITHUB_REPO=aydarnuman/ProCheff-New

# AI Assistant Settings
AI_ASSISTANT_ENABLED=true
AI_RESPONSE_DELAY=5
AI_MAX_TOKENS=4000
```

### GitHub Actions Workflow

`.github/workflows/ai-assistance.yml` dosyası ile otomasyonu aktifleştirin:

```yaml
name: AI Assistance
on:
  issues:
    types: [opened, labeled]

jobs:
  ai-response:
    if: contains(github.event.issue.labels.*.name, 'ai-assistance')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Process AI Request
        run: node scripts/ai-assistance-handler.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## 🛠️ Development

### AI Handler Script

`scripts/ai-assistance-handler.js` dosyası AI taleplerine yanıt verir:

```javascript
// Temel yapı
async function handleAIRequest(issue) {
  const { title, body, labels } = issue;
  
  // AI request type'ı belirle
  const requestType = extractRequestType(body);
  
  // AI API'ye gönder
  const aiResponse = await callAIAPI(requestType, body);
  
  // GitHub'a yanıt yaz
  await postIssueComment(issue.number, aiResponse);
  
  // Gerekirse PR aç
  if (requestType === 'code-generation') {
    await createPullRequest(issue, aiResponse);
  }
}
```

### Testing AI Integration

Test scripti ile entegrasyonu test edin:

```bash
# AI integration test
npm run ai:test

# Manuel test
node scripts/test-ai-integration.js
```

## 📊 Best Practices

### 1. Clear Request Descriptions
```markdown
❌ Kötü: "Kod yaz"
✅ İyi: "src/components/ui/ altına Türkçe UI prop'ları ile Button bileşeni oluştur"
```

### 2. Provide Context
```markdown
❌ Kötü: "Hata var"
✅ İyi: "src/app/ihale/page.tsx:45'te TypeScript tipi hatası, TenderData interface'i eksik"
```

### 3. Define Acceptance Criteria
```markdown
❌ Kötü: "Çalışmalı"
✅ İyi:
- [ ] TypeScript type-check başarılı
- [ ] Tüm testler geçmeli
- [ ] Türkçe UI standartlarına uygun
```

## 🚀 Advanced Usage

### Custom AI Prompts

Özel AI prompt'ları için `prompts/` dizinini kullanın:

```
prompts/
├── code-generation.txt
├── code-review.txt
├── documentation.txt
└── bug-analysis.txt
```

### Webhook Integration

Gerçek zamanlı AI yanıtları için webhook kullanın:

```javascript
// webhook-handler.js
app.post('/webhook/github', async (req, res) => {
  const { action, issue } = req.body;
  
  if (action === 'opened' && hasLabel(issue, 'ai-assistance')) {
    await processAIRequest(issue);
  }
  
  res.status(200).send('OK');
});
```

## 📈 Metrics & Monitoring

AI sistemi aşağıdaki metrikleri izler:

- **Response Time**: AI yanıt süresi (ortalama: 30s)
- **Success Rate**: Başarılı işlem oranı (hedef: >95%)
- **Request Types**: Talep tipi dağılımı
- **User Satisfaction**: Kullanıcı memnuniyeti

Metrikleri görüntülemek için:

```bash
npm run ai:metrics
```

## 🔒 Security

### API Key Management
- API key'leri asla repository'ye commit etmeyin
- GitHub Secrets kullanın
- Düzenli olarak rotate edin

### Rate Limiting
```javascript
const rateLimiter = {
  maxRequests: 100,
  windowMs: 3600000, // 1 hour
  message: 'Too many AI requests, please try again later'
};
```

### Access Control
```yaml
# Only allow AI assistance for authorized users
permissions:
  issues: write
  pull-requests: write
  contents: write
```

## 📚 Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [GitHub Actions Guide](https://docs.github.com/en/actions)
- [ProCheff Development Guide](./DEVELOPMENT.md)

## 🤝 Contributing

AI sistemine katkıda bulunmak için:

1. Feature branch oluşturun: `git checkout -b feature/ai-improvement`
2. Değişikliklerinizi yapın
3. Test edin: `npm run ai:test`
4. PR açın

## 🆘 Support

Sorun yaşıyorsanız:

1. [Documentation](./docs/) kontrol edin
2. GitHub Issues'da arama yapın
3. Yeni issue açın: 🐛 Bug Report veya ✨ Feature Request

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

**Last Updated**: 2025-10-24  
**Version**: 1.0.0  
**Status**: ✅ Active
