# ProCheff OCR Architecture - Tek Kaynak İlkesi

## 🏗️ **Mimari Yapısı**

```
📁 OCR Flow (Single Source of Truth)
├── 🎯 /api/pro-ocr-clean          ← TEK GEÇERLİ ENDPOINT
├── 📚 clean-pro-converter.ts      ← Pro wrapper (temizlik + format)
├── 🔧 auto-text-converter.ts      ← Core OCR mantığı
├── ☁️ ocrSpaceParse()             ← Cloud OCR çağrısı
├── 🖼️ ocrSpaceWithImages()        ← Sayfa bölme fallback
└── 📄 pdf-parse                   ← Metin çıkarma
```

## ✅ **Doğru Mantık Zinciri**

### **1. Request Flow**
```typescript
Client Request → /api/pro-ocr-clean → extractTextWithAdvancedOCR() → Result
```

### **2. Internal Processing**
```typescript
extractTextWithAdvancedOCR() {
  1. pdf-parse ile metin çıkarma dene
  2. Düşük kalite ise → ocrSpaceParse()
  3. Başarısız ise → ocrSpaceWithImages()
  4. Sonuç temizle ve formatla
  5. JSON response döndür
}
```

## 🚫 **Yapılmaması Gerekenler**

- ❌ Route içinde ikinci `fetch("https://api.ocr.space/...")` çağrısı
- ❌ Aynı buffer'ı hem converter'a hem manuel API'ye göndermek
- ❌ API key kontrolünün birden fazla yerde yapılması
- ❌ Aynı endpoint'in iki isimle var olması
- ❌ Çifte OCR işlemi yapmak

## ✅ **Tek Kaynak İlkesi Kuralları**

### **API Key Management**
```typescript
// ✅ Doğru: Sadece converter'da
const apiKey = process.env.OCR_SPACE_API_KEY; // auto-text-converter.ts içinde

// ❌ Yanlış: Route'da tekrar kontrol
if (!apiKey) { ... } // route.ts içinde YAPMA
```

### **OCR Processing**
```typescript
// ✅ Doğru: Tek converter çağrısı
const result = await extractTextWithAdvancedOCR(buffer, filename);

// ❌ Yanlış: Manual API çağrısı
const response = await fetch("https://api.ocr.space/parse/image", ...);
```

### **Error Handling**
```typescript
// ✅ Doğru: Converter'dan gelen error
return NextResponse.json({ error: result.meta.error });

// ❌ Yanlış: Route'da ayrı error handling
try { /* OCR logic */ } catch { /* duplicate error handling */ }
```

## 🛡️ **Guard System**

### **Deprecated Endpoint Protection**
```typescript
// /api/pro-ocr/route.ts
if (process.env.PRO_OCR_DISABLED === "true") {
  return NextResponse.json({
    error: "Deprecated endpoint. Use /api/pro-ocr-clean instead.",
    redirect: "/api/pro-ocr-clean"
  }, { status: 410 });
}
```

### **Environment Configuration**
```bash
# .env
PRO_OCR_DISABLED=true  # Enforce single endpoint usage
OCR_SPACE_API_KEY=your_pro_key_here
```

## 📊 **Endpoint Comparison**

| Endpoint | Status | Purpose | Usage |
|----------|--------|---------|--------|
| `/pro-ocr` | 🚫 Deprecated | Legacy | Redirects to clean |
| `/pro-ocr-clean` | ✅ Active | Main OCR | **Use this only** |

## 🔧 **Development Guidelines**

### **Adding New OCR Features**
1. ✅ Add to `auto-text-converter.ts` (core logic)
2. ✅ Update `clean-pro-converter.ts` if needed (wrapper)
3. ❌ **Never** add OCR logic to route files

### **Testing OCR Changes**
```bash
# Test only the active endpoint
curl -X POST http://localhost:3000/api/pro-ocr-clean \
  -F "file=@test.pdf"

# Deprecated endpoint should return 410
curl -X POST http://localhost:3000/api/pro-ocr \
  -F "file=@test.pdf"
```

## 🎯 **Best Practices**

1. **Single Responsibility**: Her modül tek bir OCR görevini yapar
2. **No Duplication**: API çağrısı sadece converter'da
3. **Centralized Config**: API key ve settings tek yerde
4. **Clear Boundaries**: Route = request handling, Converter = OCR logic
5. **Guard Rails**: Deprecated endpoints otomatik yönlendirme

## 🚀 **Performance Benefits**

- ⚡ Tek API çağrısı = %50 daha hızlı
- 🔧 Tek validation = daha az bug
- 📊 Tek error handling = consistent responses
- 🛡️ Tek config = kolay maintenance

---

**Özet**: ProCheff OCR sistemi **tek kaynak ilkesi** ile çalışır. Tüm OCR mantığı `auto-text-converter.ts`'de, tek endpoint `/pro-ocr-clean`'de, çifte işlem yok!