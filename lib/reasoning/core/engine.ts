/**
 * ProCheff Cognitive Reasoning Engine Core
 * Ana akıl yürütme motoru
 */

import { MenuAnalysis } from "@/lib/menu/types";
import { OfferResult } from "@/lib/offer/types";
import { evaluateRules, ReasoningResult, getRiskLevel, getPrioritySuggestions } from "../rules/defaultRules";
import { log } from "@/lib/utils/logger";

/**
 * Ana reasoning fonksiyonu
 * Menu analizi ve offer sonuçlarını alıp akıllı çıkarımlar yapar
 */
export function runReasoning(menu: MenuAnalysis, offer: OfferResult): ReasoningResult {
  try {
    log.info("Reasoning engine started", {
      menuType: menu.menuType,
      totalItems: menu.totalItems,
      offerPrice: offer.offerPrice
    });

    // Ana kural değerlendirmesi
    const result = evaluateRules(menu, offer);
    
    // Öncerikli önerileri sırala
    result.suggestions = getPrioritySuggestions(result.suggestions);
    
    // Risk seviyesi ekle
    const riskLevel = getRiskLevel(result.score);
    
    log.info("Reasoning completed", {
      score: result.score,
      riskLevel,
      risksCount: result.risks.length,
      suggestionsCount: result.suggestions.length
    });

    return {
      ...result,
      insights: [
        ...result.insights || [],
        `Genel risk seviyesi: ${riskLevel}`,
        `Toplam ${result.risks.length} risk ve ${result.suggestions.length} öneri tespit edildi`
      ]
    };

  } catch (error: any) {
    log.error("Reasoning engine error", { error: error.message });
    
    // Fallback response
    return {
      risks: ["Reasoning engine hatası"],
      suggestions: ["Sistem yöneticisi ile iletişime geçin"],
      compliance: [],
      score: 0,
      insights: ["Analiz tamamlanamadı"]
    };
  }
}

/**
 * Hızlı reasoning - sadece kritik bilgiler
 */
export function quickReasoning(menu: MenuAnalysis, offer: OfferResult): {
  score: number;
  riskLevel: string;
  topRisk?: string;
  topSuggestion?: string;
} {
  const result = runReasoning(menu, offer);
  
  return {
    score: result.score,
    riskLevel: getRiskLevel(result.score),
    topRisk: result.risks[0],
    topSuggestion: result.suggestions[0]
  };
}

/**
 * Detaylı rapor üretimi
 */
export function generateDetailedReport(menu: MenuAnalysis, offer: OfferResult): {
  executive_summary: string;
  risk_analysis: {
    total_risks: number;
    risk_level: string;
    critical_issues: string[];
  };
  recommendations: {
    immediate_actions: string[];
    medium_term: string[];
    compliance_notes: string[];
  };
  scoring: {
    overall_score: number;
    nutrition_score: number;
    financial_score: number;
    compliance_score: number;
  };
} {
  const reasoning = runReasoning(menu, offer);
  
  // Detaylı skorlama
  const nutritionRisks = reasoning.risks.filter(r => 
    r.includes('protein') || r.includes('karbonhidrat') || r.includes('yağ') || r.includes('çeşitlilik')
  );
  const financialRisks = reasoning.risks.filter(r => 
    r.includes('kâr') || r.includes('kar') || r.includes('maliyet')
  );
  const complianceIssues = reasoning.compliance.filter(c => 
    c.includes('UYARI') || c.includes('kuralı')
  );

  const nutritionScore = Math.max(0, 100 - (nutritionRisks.length * 15));
  const financialScore = Math.max(0, 100 - (financialRisks.length * 20));
  const complianceScore = Math.max(0, 100 - (complianceIssues.length * 25));

  // Önerileri kategorize et
  const immediateActions = reasoning.suggestions.filter(s => 
    s.includes('protein') || s.includes('kâr') || s.includes('eşik')
  );
  const mediumTerm = reasoning.suggestions.filter(s => 
    !immediateActions.includes(s)
  );

  return {
    executive_summary: `Genel skor ${reasoning.score}/100. ${getRiskLevel(reasoning.score)} risk seviyesi. ${reasoning.risks.length} risk tespit edildi.`,
    risk_analysis: {
      total_risks: reasoning.risks.length,
      risk_level: getRiskLevel(reasoning.score),
      critical_issues: reasoning.risks.filter(r => 
        r.includes('düşük') || r.includes('yüksek') || r.includes('yetersiz')
      )
    },
    recommendations: {
      immediate_actions: immediateActions,
      medium_term: mediumTerm,
      compliance_notes: reasoning.compliance
    },
    scoring: {
      overall_score: reasoning.score,
      nutrition_score: nutritionScore,
      financial_score: financialScore,
      compliance_score: complianceScore
    }
  };
}

/**
 * Simülasyon desteği - değişiklik etkilerini hesapla
 */
export function simulateChanges(
  menu: MenuAnalysis, 
  offer: OfferResult, 
  changes: {
    protein_increase?: number;
    cost_reduction?: number;
    margin_adjustment?: number;
  }
): {
  current_score: number;
  simulated_score: number;
  improvement: number;
  affected_areas: string[];
} {
  const currentReasoning = runReasoning(menu, offer);
  
  // Simüle edilmiş değerler
  const simulatedMenu = { ...menu };
  const simulatedOffer = { ...offer };
  
  if (changes.protein_increase) {
    simulatedMenu.macroBalance = {
      ...menu.macroBalance,
      protein: menu.macroBalance.protein + changes.protein_increase,
      carb: Math.max(0, menu.macroBalance.carb - changes.protein_increase * 0.5)
    };
  }
  
  if (changes.cost_reduction && offer.totalCost) {
    simulatedOffer.totalCost = offer.totalCost * (1 - changes.cost_reduction / 100);
    if (offer.offerPrice) {
      // Fiyatı sabit tutarak kar marjını artır
      simulatedOffer.detail = {
        ...offer.detail,
        profit: ((offer.offerPrice - simulatedOffer.totalCost) / offer.offerPrice) * 100
      };
    }
  }
  
  const simulatedReasoning = runReasoning(simulatedMenu, simulatedOffer);
  
  const affectedAreas: string[] = [];
  if (changes.protein_increase) affectedAreas.push('Beslenme Dengesi');
  if (changes.cost_reduction) affectedAreas.push('Maliyet Optimizasyonu');
  if (changes.margin_adjustment) affectedAreas.push('Kar Marjı');
  
  return {
    current_score: currentReasoning.score,
    simulated_score: simulatedReasoning.score,
    improvement: simulatedReasoning.score - currentReasoning.score,
    affected_areas: affectedAreas
  };
}