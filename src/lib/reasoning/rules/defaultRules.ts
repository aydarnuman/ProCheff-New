/**
 * ProCheff Default Reasoning Rules
 * Basit ve genişletilebilir kural seti
 */

import { MenuAnalysis } from "@/lib/menu/types";
import { OfferResult } from "@/lib/offer/types";

export interface ReasoningResult {
  risks: string[];
  suggestions: string[];
  compliance: string[];
  score: number;
  insights?: string[];
}

/**
 * Ana kural değerlendirme fonksiyonu
 */
export function evaluateRules(menu: MenuAnalysis, offer: OfferResult): ReasoningResult {
  const risks: string[] = [];
  const suggestions: string[] = [];
  const compliance: string[] = [];
  const insights: string[] = [];

  // 🍽️ Beslenme Riskleri
  evaluateNutritionalRisks(menu, risks, suggestions);

  // 💰 Finansal Riskler
  evaluateFinancialRisks(offer, risks, suggestions);

  // ⚖️ KİK Uyum Kontrolü
  evaluateComplianceRisks(offer, compliance);

  // 🧠 İçgörüler
  generateInsights(menu, offer, insights);

  // 📊 Skor hesaplama (100 üzerinden)
  const score = calculateOverallScore(risks, compliance);

  return {
    risks,
    suggestions,
    compliance,
    score,
    insights,
  };
}

/**
 * Beslenme riskleri değerlendirmesi
 */
function evaluateNutritionalRisks(
  menu: MenuAnalysis,
  risks: string[],
  suggestions: string[]
): void {
  // Protein kontrolü
  if (menu.macroBalance.protein < 15) {
    risks.push("Düşük protein oranı");
    suggestions.push("Protein içeriği yüksek yemek eklenmeli");
  } else if (menu.macroBalance.protein < 18) {
    risks.push("Protein oranı ideal seviyenin altında");
    suggestions.push("Et, tavuk, balık veya baklagil oranı artırılmalı");
  }

  // Karbonhidrat kontrolü
  if (menu.macroBalance.carb > 65) {
    risks.push("Yüksek karbonhidrat oranı");
    suggestions.push("Tahıl ve pilav oranı azaltılmalı");
  }

  // Yağ kontrolü
  if (menu.macroBalance.fat > 35) {
    risks.push("Yüksek yağ oranı");
    suggestions.push("Yağlı yemeklerin oranı azaltılmalı");
  } else if (menu.macroBalance.fat < 15) {
    risks.push("Düşük yağ oranı");
    suggestions.push("Sağlıklı yağ kaynakları eklenebilir");
  }

  // Menü çeşitliliği
  if (menu.totalItems < 5) {
    risks.push("Menü çeşitliliği yetersiz");
    suggestions.push("En az 5 farklı yemek çeşidi bulunmalı");
  }

  // Uyarılar kontrolü
  if (menu.warnings && menu.warnings.length > 0) {
    risks.push(`${menu.warnings.length} beslenme uyarısı mevcut`);
    suggestions.push("Beslenme dengesi gözden geçirilmeli");
  }
}

/**
 * Finansal riskler değerlendirmesi
 */
function evaluateFinancialRisks(offer: OfferResult, risks: string[], suggestions: string[]): void {
  // Kar oranı kontrolü (offer.detail varsa)
  if (offer.detail && offer.detail.profit) {
    if (offer.detail.profit < 3) {
      risks.push("Kâr oranı düşük");
      suggestions.push("Kâr marjı %5-10 aralığında tutulmalı");
    } else if (offer.detail.profit > 15) {
      risks.push("Kâr oranı çok yüksek");
      suggestions.push("Rekabet gücü için kâr marjı optimize edilmeli");
    }
  }

  // Maliyet-fiyat oranı kontrolü
  if (offer.totalCost && offer.offerPrice) {
    const margin = ((offer.offerPrice - offer.totalCost) / offer.offerPrice) * 100;

    if (margin < 10) {
      risks.push("Kar marjı çok düşük");
      suggestions.push("Maliyetler gözden geçirilmeli veya fiyat artırılmalı");
    }
  }

  // Threshold riski
  if (offer.belowThreshold === false) {
    risks.push("KİK eşik değerinin üzerinde teklif");
    suggestions.push("Maliyetler düşürülmeli veya verimlilik artırılmalı");
  }
}

/**
 * Uyumluluk riskleri değerlendirmesi
 */
function evaluateComplianceRisks(offer: OfferResult, compliance: string[]): void {
  // KİK uyum kontrolü
  if (offer.kThreshold && offer.kThreshold === 0.93) {
    compliance.push("KİK uyumlu teklif (K=0.93)");
  } else if (offer.kThreshold && offer.kThreshold !== 0.93) {
    compliance.push("K faktörü 0.93 olmalı (KİK uyum kuralı)");
  }

  // Threshold kontrolü
  if (offer.belowThreshold === true) {
    compliance.push("Eşik değer kontrolü geçildi");
  } else if (offer.belowThreshold === false) {
    compliance.push("UYARI: Eşik değer aşıldı - teklif reddedilebilir");
  }

  // Fiyat makul kontrolü
  if (offer.offerPrice && offer.totalCost) {
    const ratio = offer.offerPrice / offer.totalCost;
    if (ratio > 2) {
      compliance.push("UYARI: Fiyat-maliyet oranı yüksek, inceleme gerekebilir");
    } else if (ratio >= 1.1 && ratio <= 1.5) {
      compliance.push("Fiyat-maliyet oranı makul seviyede");
    }
  }
}

/**
 * Akıllı içgörüler üretimi
 */
function generateInsights(menu: MenuAnalysis, offer: OfferResult, insights: string[]): void {
  // Beslenme-maliyet ilişkisi
  if (menu.macroBalance.protein < 15 && offer.totalCost) {
    insights.push("Düşük protein oranı maliyeti azaltabilir ancak beslenme kalitesi düşer");
  }

  // Menü tipi analizi
  if (menu.menuType) {
    insights.push(`${menu.menuType} menü tipi tespit edildi`);
  }

  // Genel değerlendirme
  const proteinOK = menu.macroBalance.protein >= 15;
  const carbOK = menu.macroBalance.carb <= 65;
  const fatOK = menu.macroBalance.fat >= 15 && menu.macroBalance.fat <= 35;

  if (proteinOK && carbOK && fatOK) {
    insights.push("Beslenme dengesi genel olarak uygun");
  } else {
    insights.push("Beslenme dengesi optimize edilebilir");
  }

  // Fiyat rekabet gücü
  if (offer.offerPrice && offer.totalCost) {
    const margin = ((offer.offerPrice - offer.totalCost) / offer.offerPrice) * 100;
    if (margin >= 10 && margin <= 20) {
      insights.push("Rekabetçi kar marjı ile dengeli teklif");
    }
  }
}

/**
 * Genel skor hesaplama (100 üzerinden)
 */
function calculateOverallScore(risks: string[], compliance: string[]): number {
  // Base skor
  let score = 100;

  // Risk penalty'leri
  score -= risks.length * 10;

  // Compliance penalty'leri (uyarı içerenler için)
  const complianceWarnings = compliance.filter(
    (c) => c.includes("UYARI") || c.includes("kuralı") || c.includes("aşıldı")
  );
  score -= complianceWarnings.length * 15;

  // Kritik riskler için ekstra penalty
  const criticalRisks = risks.filter(
    (r) => r.includes("çok") || r.includes("yetersiz") || r.includes("düşük")
  );
  score -= criticalRisks.length * 5;

  // Minimum 0, maksimum 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Hızlı risk seviyesi belirleme
 */
export function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

/**
 * Öncelikli öneriler filtresi
 */
export function getPrioritySuggestions(suggestions: string[]): string[] {
  const priorities = ["protein", "kâr", "kar", "maliyet", "eşik", "uyum"];

  return suggestions.sort((a, b) => {
    const aHasPriority = priorities.some((p) => a.toLowerCase().includes(p));
    const bHasPriority = priorities.some((p) => b.toLowerCase().includes(p));

    if (aHasPriority && !bHasPriority) return -1;
    if (!aHasPriority && bHasPriority) return 1;
    return 0;
  });
}
