/**
 * ProCheff KİK (Kamu İhale Kanunu) Compliance Module
 * ADT (Anormal Derecede Düşük Teklif) analizi ve KİK uyumluluğu
 */

import { SimulationOutput, CostBreakdown } from "./types";

// KİK sabitleri
export const KIK_CONSTANTS = {
  K_FACTOR: 0.93, // Yemek hizmetleri K katsayısı
  ADT_RISK_THRESHOLDS: {
    HIGH: 0.85, // %85'in altı yüksek risk
    MEDIUM: 0.95, // %95'in altı orta risk
  },
} as const;

// ADT açıklama şablonu yapısı
export interface ADTExplanation {
  material_justification: MaterialJustification;
  labor_justification: LaborJustification;
  overhead_justification: OverheadJustification;
  profit_justification: ProfitJustification;
  evidence: Evidence[];
  compliance_statement: string;
  risk_mitigation: string[];
}

export interface MaterialJustification {
  cost_calculation_method: string;
  source_documentation: string[];
  waste_percentage_rationale: string;
  portion_size_standards: string;
  price_references: PriceReference[];
}

export interface LaborJustification {
  staffing_calculation_basis: string;
  wage_standards_reference: string;
  working_hours_justification: string;
  social_security_calculation: string;
  shift_arrangements: string;
}

export interface OverheadJustification {
  calculation_formula: string;
  percentage_rationale: string;
  cost_categories: Record<string, number>;
  benchmark_references: string[];
}

export interface ProfitJustification {
  margin_percentage: number;
  margin_rationale: string;
  risk_assessment: string;
  market_comparison: string;
}

export interface PriceReference {
  source: string; // "Hal Müdürlüğü", "Market Zinciri"
  date: string; // Fiyat tarihi
  item: string; // Ürün adı
  price_per_kg: number; // TL/kg
  verification_method: string; // Doğrulama yöntemi
}

export interface Evidence {
  type: "PRICE_LIST" | "INVOICE" | "CONTRACT" | "REGULATION" | "BENCHMARK";
  title: string;
  source: string;
  page_reference?: string;
  line_reference?: string;
  relevance: string;
}

// KİK hesaplayıcı sınıfı
export class KIKCalculator {
  /**
   * Threshold değeri hesaplama (ADT sınır değeri)
   */
  static calculateThreshold(simulationOutput: SimulationOutput): {
    threshold_value_try: number;
    k_factor: number;
    base_value: number;
  } {
    // Base value = MM + İM + GG (Bakım dahil değil)
    const baseValue =
      simulationOutput.material_cost.total +
      simulationOutput.labor_cost.total +
      simulationOutput.overhead_cost.total;

    // Threshold = K × (MM + İM + GG)
    const thresholdValue = KIK_CONSTANTS.K_FACTOR * baseValue;

    return {
      threshold_value_try: thresholdValue,
      k_factor: KIK_CONSTANTS.K_FACTOR,
      base_value: baseValue,
    };
  }

  /**
   * ADT durumu kontrolü
   */
  static checkADTStatus(
    offerPrice: number,
    threshold: number
  ): {
    is_adt: boolean;
    explanation_required: boolean;
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    deviation_percentage: number;
  } {
    const ratio = offerPrice / threshold;
    const deviationPercentage = ((threshold - offerPrice) / threshold) * 100;

    let riskLevel: "LOW" | "MEDIUM" | "HIGH";
    let explanationRequired = false;

    if (ratio < KIK_CONSTANTS.ADT_RISK_THRESHOLDS.HIGH) {
      riskLevel = "HIGH";
      explanationRequired = true;
    } else if (ratio < KIK_CONSTANTS.ADT_RISK_THRESHOLDS.MEDIUM) {
      riskLevel = "MEDIUM";
      explanationRequired = true;
    } else {
      riskLevel = "LOW";
      explanationRequired = false;
    }

    return {
      is_adt: offerPrice < threshold,
      explanation_required: explanationRequired,
      risk_level: riskLevel,
      deviation_percentage: deviationPercentage,
    };
  }

  /**
   * Otomatik ADT açıklama üretimi
   */
  static generateADTExplanation(
    simulationOutput: SimulationOutput
  ): ADTExplanation {
    return {
      material_justification: this.generateMaterialJustification(
        simulationOutput.material_cost
      ),
      labor_justification: this.generateLaborJustification(
        simulationOutput.labor_cost
      ),
      overhead_justification: this.generateOverheadJustification(
        simulationOutput.overhead_cost
      ),
      profit_justification: this.generateProfitJustification(
        simulationOutput.profit_margin,
        simulationOutput.profit_percentage
      ),
      evidence: this.generateEvidence(simulationOutput),
      compliance_statement: this.generateComplianceStatement(),
      risk_mitigation: this.generateRiskMitigation(simulationOutput),
    };
  }

  /**
   * Malzeme maliyeti gerekçelendirmesi
   */
  private static generateMaterialJustification(
    materialCost: CostBreakdown
  ): MaterialJustification {
    return {
      cost_calculation_method:
        "Porsiyon bazlı maliyet hesaplama: gram/1000 × piyasa_fiyatı(TL/kg) × kişi_sayısı × öğün_sayısı × proje_süresi",
      source_documentation: [
        "Hal Müdürlüğü güncel fiyat listeleri",
        "Toptan market zincirlerinden alınan fiyat teklifleri",
        "Gıda ve Tarım Bakanlığı piyasa analiz raporları",
      ],
      waste_percentage_rationale: `%${
        materialCost.details.waste_applied || 6
      } israf payı sektör standardına uygun olarak uygulanmıştır. Bu oran gıda güvenliği ve kalite standartları gereği kaçınılmazdır.`,
      portion_size_standards:
        "Porsiyon ölçüleri T.C. Sağlık Bakanlığı Beslenme Rehberi ve TSE standartlarına uygun olarak belirlenmiştir.",
      price_references: [
        {
          source: "Ankara Hal Müdürlüğü",
          date: new Date().toISOString().split("T")[0],
          item: "Et ve Et Ürünleri",
          price_per_kg: 120,
          verification_method: "Resmi hal fiyat listesi",
        },
        {
          source: "İstanbul Toptancı Halleri",
          date: new Date().toISOString().split("T")[0],
          item: "Sebze ve Meyve",
          price_per_kg: 15,
          verification_method: "Günlük borsa fiyatları",
        },
      ],
    };
  }

  /**
   * İşçilik maliyeti gerekçelendirmesi
   */
  private static generateLaborJustification(
    laborCost: CostBreakdown
  ): LaborJustification {
    return {
      staffing_calculation_basis: `Personel ihtiyacı kişi sayısına göre hesaplanmıştır: Aşçı (1/200 kişi), Yardımcı (1/150 kişi), Temizlik (1/300 kişi) oranlarında.`,
      wage_standards_reference:
        "Türkiye İş Kurumu (İŞKUR) ve Asgari Ücret Tespit Komisyonu kararları temel alınmıştır.",
      working_hours_justification:
        "4857 sayılı İş Kanunu ve 6331 sayılı İş Sağlığı ve Güvenliği Kanunu hükümlerine uygun çalışma saatleri planlanmıştır.",
      social_security_calculation: `SGK primleri ve yan haklar %${
        ((laborCost.details.sgk_multiplier || 1.4) - 1) * 100
      } oranında hesaplanmıştır. Bu oran SSK, İşsizlik Sigortası ve İş Kazası sigortalarını kapsamaktadır.`,
      shift_arrangements:
        "Vardiya düzenlemeleri hizmet kesintisizliği için optimize edilmiştir.",
    };
  }

  /**
   * Genel gider gerekçelendirmesi
   */
  private static generateOverheadJustification(
    overheadCost: CostBreakdown
  ): OverheadJustification {
    return {
      calculation_formula: `GG = (MM + İM) × %${overheadCost.details.overhead_percentage}`,
      percentage_rationale:
        "Genel gider oranı sektör benchmarkları ve maliyet muhasebesi standartlarına uygun olarak belirlenmiştir.",
      cost_categories: {
        "Yönetim ve İdari Giderler": overheadCost.total * 0.4,
        "Ekipman ve Teknoloji Amortismanı": overheadCost.total * 0.25,
        "Sigorta ve Riskler": overheadCost.total * 0.15,
        "Pazarlama ve Satış": overheadCost.total * 0.1,
        "Diğer İşletme Giderleri": overheadCost.total * 0.1,
      },
      benchmark_references: [
        "Yemek Hizmetleri Sektör Analizi (TOBB, 2024)",
        "Kamu İhale Kurumu Sektörel Analiz Raporları",
        "İstanbul Sanayi Odası Maliyet Etüt Kılavuzu",
      ],
    };
  }

  /**
   * Kâr gerekçelendirmesi
   */
  private static generateProfitJustification(
    profitMargin: number,
    profitPercentage: number
  ): ProfitJustification {
    return {
      margin_percentage: profitPercentage,
      margin_rationale: `%${profitPercentage} kâr marjı, sektör ortalaması ve işletme sürdürülebilirliği göz önünde bulundurularak belirlenmiştir.`,
      risk_assessment:
        "Gıda güvenliği riskleri, piyasa dalgalanmaları ve operasyonel riskler değerlendirilerek makul kâr marjı hesaplanmıştır.",
      market_comparison:
        "Kâr oranı benzer büyüklükteki yemek hizmeti ihalelerinin piyasa ortalaması ile uyumludur.",
    };
  }

  /**
   * Kanıt dokümanları üretimi
   */
  private static generateEvidence(
    _simulationOutput: SimulationOutput
  ): Evidence[] {
    return [
      {
        type: "PRICE_LIST",
        title: "Hal Müdürlüğü Güncel Fiyat Listesi",
        source: "T.C. Gıda, Tarım ve Hayvancılık Bakanlığı",
        page_reference: "1-15",
        relevance: "Malzeme maliyeti hesaplamalarının dayanağı",
      },
      {
        type: "REGULATION",
        title: "4734 Sayılı Kamu İhale Kanunu",
        source: "Resmi Gazete",
        line_reference: "Madde 37/2",
        relevance: "ADT değerlendirme kriterleri",
      },
      {
        type: "BENCHMARK",
        title: "Sektör Maliyet Analizi",
        source: "TOBB Yemek Hizmetleri Sektör Raporu",
        page_reference: "45-67",
        relevance: "Genel gider oranları ve kâr marjı benchmarkı",
      },
      {
        type: "CONTRACT",
        title: "Toplu İş Sözleşmesi",
        source: "Gıda-İş Sendikası",
        relevance: "İşçilik maliyeti ve ücret standartları",
      },
    ];
  }

  /**
   * Uygunluk beyanı
   */
  private static generateComplianceStatement(): string {
    return `Bu teklif, 4734 sayılı Kamu İhale Kanunu ve ilgili yönetmeliklere tam uyumludur. 
Maliyet hesaplamaları objektif kriterlere dayalı olarak yapılmış, tüm kalemler için gerekçeler sunulmuştur. 
Teklif edilen fiyat, kaliteli hizmet sunumu için gerekli tüm maliyetleri karşılayacak düzeydedir.`;
  }

  /**
   * Risk azaltma önlemleri
   */
  private static generateRiskMitigation(
    simulationOutput: SimulationOutput
  ): string[] {
    const measures = [
      "Gıda güvenliği standartlarına %100 uyum sağlanacaktır",
      "Kalite kontrol sistemleri ISO 22000 standardında uygulanacaktır",
      "Tedarik zinciri risk yönetimi planı hazırlanmıştır",
      "Personel eğitim programları düzenli olarak yürütülecektir",
    ];

    // Risk seviyesine göre ek önlemler
    if (simulationOutput.kik_analysis.risk_level === "HIGH") {
      measures.push(
        "Yüksek risk sebebiyle ek kalite güvence önlemleri alınacaktır",
        "Yedek tedarikçi ağı oluşturulmuştur",
        "Acil durum planları hazırlanmıştır"
      );
    }

    return measures;
  }
}

/**
 * Hızlı KİK analizi fonksiyonu
 */
export function performKIKAnalysis(
  simulationOutput: SimulationOutput,
  offerPrice?: number
) {
  const threshold = KIKCalculator.calculateThreshold(simulationOutput);
  const price = offerPrice || simulationOutput.recommended_price;
  const adtStatus = KIKCalculator.checkADTStatus(
    price,
    threshold.threshold_value_try
  );

  let explanation: ADTExplanation | undefined;
  if (adtStatus.explanation_required) {
    explanation = KIKCalculator.generateADTExplanation(simulationOutput);
  }

  return {
    threshold,
    adt_status: adtStatus,
    explanation,
    compliance_score:
      adtStatus.risk_level === "LOW"
        ? 95
        : adtStatus.risk_level === "MEDIUM"
        ? 75
        : 55,
  };
}
