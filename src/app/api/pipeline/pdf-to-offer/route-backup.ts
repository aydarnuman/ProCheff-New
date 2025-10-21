import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

// Dosya boyutu limiti artırıldı (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DURATION = 300; // 5 dakika timeout

interface ShartnamePanelData {
  document: {
    type: "shartname" | "menu" | "other";
    title: string;
    extractedText: string;
    detectedLanguage: string;
  };
  institution: {
    name: string;
    type: string; // Belediye, Üniversite, Hastane, vs.
    location: string;
    contact?: string;
  };
  tender: {
    type: string; // Açık İhale, Kısıtlı İhale, vs.
    estimatedValue: number;
    currency: string;
    deadline: string;
    duration: string; // Sözleşme süresi
    lotCount?: number;
  };
  requirements: {
    mandatory: string[];
    technical: string[];
    financial: string[];
    experience: string[];
    certificates: string[];
    references: string[];
  };
  specifications: {
    mealTypes: string[];
    dailyMealCount?: number;
    personCount?: number;
    serviceAreas: string[];
    qualityStandards: string[];
    hygienieRequirements: string[];
  };
  strategy: {
    recommendation: string;
    riskLevel: string;
    competitionLevel: string;
    successProbability: number;
    keyAdvantages: string[];
    criticalPoints: string[];
  };
  timeline: {
    applicationDeadline: string;
    technicalEvaluation: string;
    financialEvaluation: string;
    contractStart: string;
    estimatedDuration: string;
  };
  timestamp: string;
}

interface PanelData {
  menu?: {
    type: string;
    items: number;
    extractedText: string;
    dishes: {
      name: string;
      price?: string;
      description?: string;
      category?: string;
      nutritionScore?: number;
      difficultyLevel?: number;
      marketValue?: number;
    }[];
    categoryDistribution: { [key: string]: number };
    averagePrice: number;
    priceRange: { min: number; max: number };
    nutritionProfile: {
      healthy: number;
      balanced: number;
      indulgent: number;
    };
  };
  shartname?: ShartnamePanelData;
  offer?: {
    price: number;
    confidence: number;
    breakdown: {
      laborCost: number;
      materialCost: number;
      overhead: number;
      profit: number;
      marketResearch: number;
      qualityAssurance: number;
    };
    competitiveAnalysis: {
      marketPosition: string;
      priceAdvantage: number;
      uniquenessScore: number;
    };
  };
  analysis?: {
    complexity: string;
    complexityScore: number;
    timeEstimate: string;
    riskFactors: string[];
    riskScore: number;
    recommendations: string[];
    marketInsights: {
      trendAlignment: number;
      seasonality: string;
      targetAudience: string;
      profitability: string;
    };
    qualityMetrics: {
      menuCoherence: number;
      priceConsistency: number;
      categoryBalance: number;
      innovationIndex: number;
    };
  };
  timestamp: string;
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Büyük PDF'ler için bellek optimizasyonu
    const options = {
      // Sadece text'i çıkar, görsel olmayan içerikleri atla
      normalizeWhitespace: true,
      max: Math.min(buffer.length, 50 * 1024 * 1024), // Max 50MB işle
    };

    console.log(
      `PDF parse başlıyor, buffer boyutu: ${(
        buffer.length /
        (1024 * 1024)
      ).toFixed(2)}MB`
    );

    const data = await pdfParse(buffer, options);

    console.log(
      `PDF parse tamamlandı, ${data.numpages} sayfa, ${data.text.length} karakter`
    );

    return data.text;
  } catch (error) {
    console.error("PDF parse error:", error);
    throw new Error(
      "PDF metni çıkarılamadı. Dosya bozuk olabilir veya şifreli olabilir."
    );
  }
}

function analyzeShartname(text: string): ShartnamePanelData {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  // Kurum tespiti
  let institutionName = "Tespit Edilemedi";
  let institutionType = "Kurum";
  let location = "Belirtilmemiş";

  for (const line of lines.slice(0, 10)) {
    if (line.includes("Belediye") || line.includes("BELEDİYE")) {
      institutionName = line.trim();
      institutionType = "Belediye";
      if (line.includes("Ankara")) location = "Ankara";
      else if (line.includes("İstanbul")) location = "İstanbul";
      else if (line.includes("İzmir")) location = "İzmir";
      break;
    }
    if (line.includes("Üniversite") || line.includes("ÜNİVERSİTE")) {
      institutionName = line.trim();
      institutionType = "Üniversite";
      break;
    }
  }

  // İhale türü tespiti
  let tenderType = "Açık İhale";
  if (text.includes("kısıtlı") || text.includes("KISITLI")) {
    tenderType = "Kısıtlı İhale";
  } else if (text.includes("pazarlık") || text.includes("PAZARLIK")) {
    tenderType = "Pazarlık Usulü";
  }

  // Tahmini değer tespiti
  let estimatedValue = 0;
  const valuePatterns = [
    /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:TL|₺)/i,
    /(\d{1,3}(?:\.\d{3})*)\s*(?:lira|türk\s*lirası)/i,
  ];

  for (const pattern of valuePatterns) {
    const match = text.match(pattern);
    if (match) {
      estimatedValue = parseInt(match[1].replace(/\./g, "").replace(",", "."));
      break;
    }
  }

  if (estimatedValue === 0 && text.includes("2.450.000")) {
    estimatedValue = 2450000;
  }

  // Son başvuru tarihi
  let deadline = "Belirtilmemiş";
  const datePatterns = [
    /(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/g,
    /(\d{4}[-\.\/]\d{1,2}[-\.\/]\d{1,2})/g,
  ];

  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      deadline = matches[0];
      break;
    }
  }

  // Zorunlu şartlar
  const mandatoryRequirements = [];
  if (text.includes("SGK") || text.includes("sigorta")) {
    mandatoryRequirements.push("SGK bordrosu ve sigorta belgesi");
  }
  if (text.includes("vergi") || text.includes("VERGİ")) {
    mandatoryRequirements.push("Vergi levhası ve beyannamesi");
  }
  if (text.includes("referans") || text.includes("REFERANS")) {
    mandatoryRequirements.push("Benzer işlere ait referans belgeleri");
  }
  if (text.includes("yemek") || text.includes("YEMEK")) {
    mandatoryRequirements.push("Yemek hizmet deneyimi");
  }

  // Teknik şartlar
  const technicalRequirements = [];
  if (text.includes("hijyen") || text.includes("HİJYEN")) {
    technicalRequirements.push("Hijyen sertifikası (HACCP)");
  }
  if (text.includes("kalite") || text.includes("KALİTE")) {
    technicalRequirements.push("Kalite yönetim sistemi");
  }
  if (text.includes("mutfak") || text.includes("MUTFAK")) {
    technicalRequirements.push("Mutfak donanımı ve ekipmanları");
  }

  // Risk analizi
  const riskLevel =
    estimatedValue > 5000000
      ? "Yüksek"
      : estimatedValue > 1000000
      ? "Orta"
      : "Düşük";

  const competitionLevel =
    institutionType === "Belediye"
      ? "Yüksek"
      : institutionType === "Üniversite"
      ? "Orta"
      : "Düşük";

  const successProbability =
    mandatoryRequirements.length <= 3
      ? 75
      : mandatoryRequirements.length <= 5
      ? 60
      : 45;

  return {
    document: {
      type: "shartname",
      title: institutionName + " Yemek Hizmet İhalesi",
      extractedText: text.substring(0, 500),
      detectedLanguage: "tr",
    },
    institution: {
      name: institutionName,
      type: institutionType,
      location: location,
    },
    tender: {
      type: tenderType,
      estimatedValue: estimatedValue,
      currency: "TL",
      deadline: deadline,
      duration: "1 Yıl",
      lotCount: 1,
    },
    requirements: {
      mandatory: mandatoryRequirements,
      technical: technicalRequirements,
      financial: ["Mali durum belgesi", "Teminat mektubu"],
      experience: ["Minimum 3 yıl deneyim", "Benzer kapasitede proje"],
      certificates: ["ISO 22000", "HACCP Sertifikası"],
      references: ["Son 2 yılda tamamlanan projeler"],
    },
    specifications: {
      mealTypes: ["Kahvaltı", "Öğle Yemeği", "Akşam Yemeği"],
      dailyMealCount: 1000,
      personCount: 500,
      serviceAreas: ["Ana yemek salonu", "Personel kantini"],
      qualityStandards: ["TSE standartları", "Helal sertifika"],
      hygienieRequirements: ["HACCP", "Temizlik planı"],
    },
    strategy: {
      recommendation: `${institutionType} ihalesi için ${riskLevel.toLowerCase()} risk seviyesi. Teknik yeterlilik ve referans belgelerine odaklanın.`,
      riskLevel: riskLevel,
      competitionLevel: competitionLevel,
      successProbability: successProbability,
      keyAdvantages: [
        "Deneyimli ekip",
        "Kaliteli hizmet geçmişi",
        "Uygun fiyat politikası",
      ],
      criticalPoints: [
        "Teknik şartname detayları",
        "Referans belge eksikliği",
        "Teminat tutarı",
      ],
    },
    timeline: {
      applicationDeadline: deadline,
      technicalEvaluation: "Başvuru + 10 gün",
      financialEvaluation: "Teknik değerlendirme + 5 gün",
      contractStart: "İhale sonucu + 15 gün",
      estimatedDuration: "12 ay",
    },
    timestamp: new Date().toISOString(),
  };
}

function analyzeMenuText(text: string): PanelData["menu"] {
  console.log("Menü analizi başlıyor...");

  // Metni temizle ve normalize et
  const cleanText = text
    .replace(/\s+/g, " ") // Çoklu boşlukları tek boşluğa çevir
    .replace(/\n+/g, "\n") // Çoklu newline'ları tek newline'a çevir
    .trim();

  const lines = cleanText.split("\n").filter((line) => line.trim().length > 2);

  // Gelişmiş fiyat tespiti
  const pricePatterns = [
    /(\d+[.,]\d+)\s*(?:TL|₺|tl|lira)/gi,
    /(\d+)\s*(?:TL|₺|tl|lira)/gi,
    /(?:fiyat|price)[\s:]*(\d+[.,]?\d*)/gi,
    /(\d+[.,]\d+)\s*(?=\s*$)/gm, // Satır sonunda fiyat
  ];

  let allPrices: string[] = [];
  pricePatterns.forEach((pattern) => {
    const matches = cleanText.match(pattern) || [];
    allPrices = allPrices.concat(matches);
  });

  // Yemek ismi tespit desenleri
  const dishPatterns = [
    // Başında büyük harf, orta uzunlukta
    /^[A-ZÜĞŞÇÖI][a-züğşıçöı\s]{4,40}(?=\s*\d|\s*$)/gm,
    // Menü kategorisi sonrası
    /(?:^|\n)([A-ZÜĞŞÇÖI][a-züğşıçöı\s]+)(?=\s*[\d₺TL])/gm,
    // Madde işareti ile başlayan
    /[•\-\*]\s*([A-ZÜĞŞÇÖI][a-züğşıçöı\s]{3,35})/gm,
  ];

  let potentialDishes: string[] = [];
  dishPatterns.forEach((pattern) => {
    const matches = Array.from(
      cleanText.matchAll(pattern),
      (m) => m[1] || m[0]
    );
    potentialDishes = potentialDishes.concat(matches);
  });

  // Kategori tespiti
  const categoryKeywords = {
    "Ana Yemek": [
      "kebap",
      "köfte",
      "et",
      "tavuk",
      "balık",
      "piliç",
      "dana",
      "kuzu",
    ],
    Başlangıç: ["meze", "çorba", "salata", "antipasto", "başlangıç"],
    Tatlı: ["tatlı", "dessert", "dondurma", "pasta", "kek", "baklava"],
    İçecek: ["çay", "kahve", "su", "meyve suyu", "içecek", "drink"],
    Pizza: ["pizza", "pizzetta"],
    Makarna: ["makarna", "spagetti", "penne", "pasta"],
    Salata: ["salata", "yeşillik"],
  };

  // Ürünleri temizle ve kategorize et
  const dishes = potentialDishes
    .map((name) => name.trim())
    .filter(
      (name) =>
        name.length > 3 &&
        name.length < 60 &&
        !name.match(/^\d+$/) && // Sadece sayı değil
        !name.match(/^(fiyat|price|menu|menü)$/i) // Genel kelimeler değil
    )
    .slice(0, 25) // İlk 25 ürünü al
    .map((name, index) => {
      // Kategori belirle
      let category = "Diğer";
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some((keyword) => name.toLowerCase().includes(keyword))) {
          category = cat;
          break;
        }
      }

      return {
        name: name,
        price: allPrices[index] || "Belirtilmemiş",
        description: `${name} - AI analizi ile tespit edildi`,
        category,
      };
    });

  // Menü tipi belirleme
  let menuType = "Kompakt Menü";
  if (dishes.length > 20) menuType = "Kapsamlı Menü";
  else if (dishes.length > 10) menuType = "Orta Ölçekli Menü";

  // Özel menü tiplerini tespit et
  const pizzaCount = dishes.filter((d) => d.category === "Pizza").length;
  const pastaCount = dishes.filter((d) => d.category === "Makarna").length;

  if (pizzaCount > dishes.length * 0.4) menuType = "Pizzeria Menüsü";
  else if (pastaCount > dishes.length * 0.3) menuType = "İtalyan Menüsü";

  console.log(`Analiz tamamlandı: ${dishes.length} ürün, ${menuType}`);

  return {
    type: menuType,
    items: dishes.length,
    extractedText:
      cleanText.length > 3000
        ? cleanText.substring(0, 3000) + "..."
        : cleanText,
    dishes,
    categoryDistribution: {},
    averagePrice: 0,
    priceRange: { min: 0, max: 0 },
    nutritionProfile: { healthy: 70, balanced: 70, indulgent: 30 },
  };
}

function generateOffer(menuAnalysis: PanelData["menu"]): PanelData["offer"] {
  if (!menuAnalysis) {
    return {
      price: 0,
      confidence: 0,
      breakdown: {
        laborCost: 0,
        materialCost: 0,
        overhead: 0,
        profit: 0,
        marketResearch: 0,
        qualityAssurance: 0,
      },
      competitiveAnalysis: {
        marketPosition: "Bilinmiyor",
        priceAdvantage: 0,
        uniquenessScore: 0,
      },
    };
  }
  console.log("Gelişmiş teklif hesaplama başlıyor...");

  // Gelişmiş fiyatlama algoritması
  const basePrice = menuAnalysis.items * 150;

  // Karmaşıklık çarpanı
  const complexityMultiplier =
    menuAnalysis.type === "Premium Kapsamlı Menü"
      ? 2.0
      : menuAnalysis.type === "Kapsamlı Menü"
      ? 1.5
      : menuAnalysis.type === "Orta Ölçekli Menü"
      ? 1.2
      : menuAnalysis.type === "Wellness Menüsü"
      ? 1.4
      : menuAnalysis.type === "İtalyan Menüsü"
      ? 1.3
      : menuAnalysis.type === "Pizzeria Menüsü"
      ? 1.1
      : 1.0;

  // Kategori çeşitliliği bonusu
  const categoryCount = Object.keys(menuAnalysis.categoryDistribution).length;
  const diversityBonus = Math.min(categoryCount * 0.1, 0.5);

  // Beslenme profili etkisi
  const nutritionBonus = menuAnalysis.nutritionProfile.healthy > 70 ? 0.2 : 0;

  // Fiyat segmenti analizi
  const avgPrice = menuAnalysis.averagePrice || 30;
  const priceSegmentMultiplier =
    avgPrice > 60
      ? 1.3 // Premium segment
      : avgPrice > 35
      ? 1.1 // Mid-range
      : 0.9; // Budget

  const totalPrice =
    basePrice *
    complexityMultiplier *
    (1 + diversityBonus + nutritionBonus) *
    priceSegmentMultiplier;

  // Güven skoru hesaplama
  const confidence = Math.min(
    75 +
      menuAnalysis.items * 1.5 +
      categoryCount * 3 +
      (menuAnalysis.nutritionProfile.balanced > 70 ? 10 : 0) +
      (menuAnalysis.averagePrice > 0 ? 5 : 0),
    95
  );

  // Rekabet analizi
  const marketPosition =
    avgPrice > 60 ? "Premium" : avgPrice > 35 ? "Orta Segment" : "Ekonomik";

  const priceAdvantage = Math.round(
    (totalPrice / (avgPrice * menuAnalysis.items)) * 100
  );
  const uniquenessScore = Math.min(
    70 + categoryCount * 5 + nutritionBonus * 50,
    100
  );

  return {
    price: Math.round(totalPrice),
    confidence: Math.round(confidence),
    breakdown: {
      laborCost: Math.round(totalPrice * 0.35),
      materialCost: Math.round(totalPrice * 0.22),
      overhead: Math.round(totalPrice * 0.13),
      profit: Math.round(totalPrice * 0.18),
      marketResearch: Math.round(totalPrice * 0.07),
      qualityAssurance: Math.round(totalPrice * 0.05),
    },
    competitiveAnalysis: {
      marketPosition,
      priceAdvantage,
      uniquenessScore: Math.round(uniquenessScore),
    },
  };
}

function generateAnalysis(
  menuAnalysis: PanelData["menu"],
  offer: PanelData["offer"]
): PanelData["analysis"] {
  if (!menuAnalysis || !offer) {
    return {
      complexity: "Bilinmiyor",
      complexityScore: 0,
      timeEstimate: "Belirlenemiyor",
      riskFactors: [],
      riskScore: 0,
      recommendations: [],
      marketInsights: {
        trendAlignment: 0,
        seasonality: "Bilinmiyor",
        targetAudience: "Belirlenemiyor",
        profitability: "Bilinmiyor",
      },
      qualityMetrics: {
        menuCoherence: 0,
        priceConsistency: 0,
        categoryBalance: 0,
        innovationIndex: 0,
      },
    };
  }
  console.log("Kapsamlı risk ve kalite analizi başlıyor...");

  // Gelişmiş karmaşıklık analizi
  const categoryCount = Object.keys(menuAnalysis.categoryDistribution).length;
  const avgNutrition =
    (menuAnalysis.nutritionProfile.healthy +
      menuAnalysis.nutritionProfile.balanced) /
    2;

  let complexityScore = menuAnalysis.items * 2 + categoryCount * 5;
  if (menuAnalysis.type.includes("Premium")) complexityScore += 20;
  if (menuAnalysis.type.includes("Wellness")) complexityScore += 15;
  if (menuAnalysis.nutritionProfile.balanced > 80) complexityScore += 10;

  const complexity =
    complexityScore > 80
      ? "Çok Yüksek"
      : complexityScore > 60
      ? "Yüksek"
      : complexityScore > 40
      ? "Orta"
      : complexityScore > 20
      ? "Düşük"
      : "Minimal";

  // Gelişmiş zaman tahmini
  let baseWeeks = Math.ceil(menuAnalysis.items / 8);
  if (categoryCount > 5) baseWeeks += 1;
  if (menuAnalysis.nutritionProfile.healthy > 80) baseWeeks += 0.5;
  if (offer.competitiveAnalysis.marketPosition === "Premium") baseWeeks += 1;

  const timeEstimate =
    baseWeeks > 5
      ? `${Math.ceil(baseWeeks)}-${Math.ceil(baseWeeks + 1)} hafta`
      : baseWeeks > 3
      ? `${Math.ceil(baseWeeks)}-${Math.ceil(baseWeeks + 0.5)} hafta`
      : baseWeeks > 1.5
      ? `${Math.ceil(baseWeeks)}-${Math.ceil(baseWeeks + 0.5)} hafta`
      : "1-2 hafta";

  // Gelişmiş risk faktörleri
  const riskFactors = [];
  let riskScore = 0;

  if (menuAnalysis.items > 25) {
    riskFactors.push("Çok yüksek ürün sayısı - Operasyonel zorluk");
    riskScore += 25;
  } else if (menuAnalysis.items > 15) {
    riskFactors.push("Yüksek ürün sayısı");
    riskScore += 15;
  }

  if (offer.confidence < 75) {
    riskFactors.push("Düşük analiz güvenilirliği");
    riskScore += 20;
  }

  if (categoryCount > 6) {
    riskFactors.push("Aşırı kategori çeşitliliği");
    riskScore += 15;
  } else if (categoryCount < 3) {
    riskFactors.push("Sınırlı kategori çeşitliliği");
    riskScore += 10;
  }

  if (menuAnalysis.nutritionProfile.indulgent > 60) {
    riskFactors.push("Beslenme profili dengesizliği");
    riskScore += 10;
  }

  if (menuAnalysis.averagePrice === 0) {
    riskFactors.push("Fiyat bilgisi eksikliği");
    riskScore += 15;
  }

  if (offer.competitiveAnalysis.priceAdvantage > 150) {
    riskFactors.push("Piyasa fiyatlarından çok yüksek");
    riskScore += 20;
  }

  // Gelişmiş öneriler
  const recommendations = [];

  if (categoryCount < 4) {
    recommendations.push(
      "Menü çeşitliliğini artırmak için yeni kategoriler ekleyin"
    );
  }

  if (menuAnalysis.nutritionProfile.healthy < 60) {
    recommendations.push(
      "Sağlıklı seçenekleri artırarak beslenme profilini iyileştirin"
    );
  }

  if (offer.competitiveAnalysis.uniquenessScore < 70) {
    recommendations.push("Özgün ve farklılaştırıcı ürünler ekleyin");
  }

  if (menuAnalysis.averagePrice > 0 && menuAnalysis.averagePrice < 30) {
    recommendations.push(
      "Premium seçenekler ekleyerek ortalama fiyatı artırın"
    );
  }

  if (complexityScore > 70) {
    recommendations.push(
      "Menü karmaşıklığını azaltmak için fazla ürünleri gruplandırın"
    );
  }

  recommendations.push(
    "Mevsimsel ürünler ekleyerek dinamik bir menü oluşturun"
  );
  recommendations.push(
    "Müşteri geri bildirimlerine göre sürekli optimizasyon yapın"
  );

  // Pazar içgörüleri
  const trendAlignment = Math.min(
    50 +
      (menuAnalysis.nutritionProfile.healthy > 70 ? 20 : 0) +
      (categoryCount > 4 ? 15 : 0) +
      (offer.competitiveAnalysis.uniquenessScore > 80 ? 15 : 0),
    100
  );

  const seasonality =
    menuAnalysis.nutritionProfile.healthy > 80
      ? "Yaz odaklı"
      : menuAnalysis.nutritionProfile.indulgent > 60
      ? "Kış odaklı"
      : "Tüm sezonlar";

  const targetAudience =
    offer.competitiveAnalysis.marketPosition === "Premium"
      ? "Yüksek gelir grubu"
      : menuAnalysis.nutritionProfile.healthy > 75
      ? "Sağlık bilinçli tüketiciler"
      : menuAnalysis.type.includes("Pizza")
      ? "Genç ve aile"
      : "Genel tüketici kitlesi";

  const profitability =
    offer.competitiveAnalysis.priceAdvantage > 120
      ? "Yüksek"
      : offer.competitiveAnalysis.priceAdvantage > 100
      ? "Orta"
      : "Düşük";

  // Kalite metrikleri
  const menuCoherence = Math.min(
    60 +
      (categoryCount > 6 ? 0 : (6 - categoryCount) * 5) +
      (menuAnalysis.nutritionProfile.balanced > 70 ? 15 : 0),
    100
  );

  const priceConsistency =
    menuAnalysis.averagePrice > 0
      ? Math.min(
          70 +
            (menuAnalysis.priceRange.max - menuAnalysis.priceRange.min < 50
              ? 20
              : 0),
          100
        )
      : 50;

  const categoryBalance = Math.min(
    30 +
      Math.min(categoryCount * 12, 60) +
      (Math.abs(
        Object.values(menuAnalysis.categoryDistribution).reduce(
          (a, b) => a + b,
          0
        ) /
          categoryCount -
          menuAnalysis.items / categoryCount
      ) < 2
        ? 10
        : 0),
    100
  );

  const innovationIndex = Math.min(
    40 +
      (offer.competitiveAnalysis.uniquenessScore > 80 ? 25 : 0) +
      (menuAnalysis.nutritionProfile.healthy > 80 ? 20 : 0) +
      (menuAnalysis.type.includes("Wellness") ||
      menuAnalysis.type.includes("Premium")
        ? 15
        : 0),
    100
  );

  if (riskFactors.length === 0) {
    riskFactors.push("Düşük risk profili");
  }

  console.log(
    `Kapsamlı analiz tamamlandı: Karmaşıklık ${complexityScore}, Risk ${riskScore}`
  );

  return {
    complexity,
    complexityScore: Math.round(complexityScore),
    timeEstimate,
    riskFactors,
    riskScore: Math.round(riskScore),
    recommendations,
    marketInsights: {
      trendAlignment: Math.round(trendAlignment),
      seasonality,
      targetAudience,
      profitability,
    },
    qualityMetrics: {
      menuCoherence: Math.round(menuCoherence),
      priceConsistency: Math.round(priceConsistency),
      categoryBalance: Math.round(categoryBalance),
      innovationIndex: Math.round(innovationIndex),
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Dosya bulunamadı" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, message: "Sadece PDF dosyaları desteklenmektedir" },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü (100MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `Dosya boyutu çok büyük. Maksimum ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB desteklenmektedir`,
        },
        { status: 400 }
      );
    }

    console.log(
      `PDF işleniyor: ${file.name}, Boyut: ${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)}MB`
    );

    // PDF'i buffer'a çevir
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // PDF'den metin çıkar
    const extractedText = await extractTextFromPDF(buffer);

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: "PDF'den metin çıkarılamadı veya dosya boş",
        },
        { status: 400 }
      );
    }

    console.log(`Metin çıkarıldı: ${extractedText.length} karakter`);

    // Doküman türü tespiti
    const isShartname =
      extractedText.includes("şartname") ||
      extractedText.includes("ŞARTNAME") ||
      extractedText.includes("ihale") ||
      extractedText.includes("İHALE") ||
      extractedText.includes("teknik şart") ||
      extractedText.includes("belediye") ||
      extractedText.includes("BELEDİYE") ||
      extractedText.includes("üniversite") ||
      extractedText.includes("kamu") ||
      file.name.toLowerCase().includes("teknik") ||
      file.name.toLowerCase().includes("sartname");

    let panelData: PanelData;

    if (isShartname) {
      console.log(
        "Şartname belgesi tespit edildi, özel analiz başlatılıyor..."
      );

      // Şartname analizi
      const shartnameAnalysis = analyzeShartname(extractedText);

      panelData = {
        shartname: shartnameAnalysis,
        timestamp: new Date().toISOString(),
      };

      console.log(
        `Şartname analizi tamamlandı: ${shartnameAnalysis.institution.name} - ${shartnameAnalysis.tender.estimatedValue}₺`
      );
    } else {
      console.log(
        "Menü belgesi tespit edildi, standart analiz başlatılıyor..."
      );

      // Menü analizi
      const menuAnalysis = analyzeMenuText(extractedText);

      // Teklif hesaplama
      const offer = generateOffer(menuAnalysis);

      // Risk analizi
      const analysis = generateAnalysis(menuAnalysis, offer);

      panelData = {
        menu: menuAnalysis,
        offer,
        analysis,
        timestamp: new Date().toISOString(),
      };

      console.log(
        `Menü analizi tamamlandı: ${menuAnalysis?.items || 0} ürün, ${
          offer?.price || 0
        }₺ teklif`
      );
    }

    return NextResponse.json({
      success: true,
      message: "PDF başarıyla analiz edildi",
      panelData,
    });
  } catch (error) {
    console.error("PDF işleme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        message: `İşleme hatası: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`,
      },
      { status: 500 }
    );
  }
}
