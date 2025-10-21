/**
 * ProCheff Cost Simulation Engine
 * Maliyet simülasyonu core hesaplama motoru
 */

import {
  SimulationInput,
  SimulationOutput,
  CostBreakdown,
  StaffMember,
  DEFAULT_CONFIG,
  DEFAULT_STAFFING_RULES,
  SimulationConfig,
} from "./types";

export class CostSimulationEngine {
  private config: SimulationConfig;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Ana simülasyon fonksiyonu
   */
  async simulate(input: SimulationInput): Promise<SimulationOutput> {
    // 1. Girdi doğrulama ve eksik veri tamamlama
    const validatedInput = this.validateAndComplete(input);

    // 2. Maliyet hesaplamaları
    const materialCost = this.calculateMaterialCost(validatedInput);
    const laborCost = this.calculateLaborCost(validatedInput);
    const overheadCost = this.calculateOverheadCost(
      materialCost,
      laborCost,
      validatedInput
    );
    const maintenanceCost = this.calculateMaintenanceCost(validatedInput);

    // 3. Toplam ve kâr hesaplaması
    const projectTotal =
      materialCost.total +
      laborCost.total +
      overheadCost.total +
      (maintenanceCost?.total || 0);
    const profitInfo = this.calculateProfit(projectTotal, validatedInput);
    const recommendedPrice = projectTotal + profitInfo.margin;

    // 4. KİK analizi
    const kikAnalysis = this.performKIKAnalysis(
      materialCost,
      laborCost,
      overheadCost,
      recommendedPrice
    );

    // 5. Güven skoru hesaplama
    const confidence = this.calculateConfidence(validatedInput);

    return {
      material_cost: materialCost,
      labor_cost: laborCost,
      overhead_cost: overheadCost,
      maintenance_cost: maintenanceCost,
      project_total: projectTotal,
      recommended_price: recommendedPrice,
      profit_margin: profitInfo.margin,
      profit_percentage: profitInfo.percentage,
      kik_analysis: kikAnalysis,
      confidence,
      calculated_at: new Date().toISOString(),
      version: "1.0",
      kik_summary: {
        compliant: !kikAnalysis.explanation_required,
        risk_level: kikAnalysis.risk_level,
        threshold_ratio: (
          recommendedPrice / kikAnalysis.threshold_value_try
        ).toFixed(3),
        audit_version: kikAnalysis.audit_trail?.version || "unknown",
      },
    };
  }

  /**
   * 1. Malzeme Maliyeti (MM) Hesaplama
   */
  private calculateMaterialCost(input: SimulationInput): CostBreakdown {
    const dailyCosts: Record<string, number> = {};
    let dailyTotal = 0;

    for (const portion of input.portion_specs) {
      // Her porsiyon için: gram/1000 × piyasa_birim_fiyat(TRY/kg)
      const costPerPortion =
        (portion.gram_per_portion / 1000) * portion.market_price_per_kg;

      // İsraf payı ekleme: %W (varsayılan %6)
      const wastePercentage =
        portion.waste_percentage || this.config.default_waste_percentage;
      const wasteMultiplier = 1 + wastePercentage / 100;

      // Günlük maliyet: kişi_sayısı × porsiyon_maliyeti × öğün_sayısı × israf_çarpanı
      const dailyCost =
        input.persons * costPerPortion * input.meals_per_day * wasteMultiplier;

      dailyCosts[portion.category] = dailyCost;
      dailyTotal += dailyCost;
    }

    // Hizmet günleri hesaplanması
    const serviceDaysPerWeek =
      input.service_days_per_week || this.config.default_service_days_per_week;
    const totalServiceDays = (input.duration_days / 7) * serviceDaysPerWeek;

    return {
      daily: dailyTotal,
      total: dailyTotal * totalServiceDays,
      per_person: (dailyTotal * totalServiceDays) / input.persons,
      details: {
        ...dailyCosts,
        total_service_days: totalServiceDays,
        waste_applied:
          Object.values(dailyCosts).reduce((sum, cost) => sum + cost, 0) * 0.06, // %6 israf gösterimi
      },
    };
  }

  /**
   * 2. İşçilik Maliyeti (İM) Hesaplama
   */
  private calculateLaborCost(input: SimulationInput): CostBreakdown {
    let staffing = input.staffing;

    // Staffing yoksa otomatik türet
    if (!staffing || staffing.length === 0) {
      staffing = this.generateStaffing(input.persons);
    }

    const dailyCosts: Record<string, number> = {};
    let dailyTotal = 0;

    for (const staff of staffing) {
      // Rol bazlı hesaplama: adet × saat/gün × ücret/saat
      const baseDailyCost =
        staff.count * staff.hours_per_day * staff.hourly_wage;

      // Vardiya katsayısı
      const shiftMultiplier =
        staff.shift_multiplier || this.config.default_shift_multiplier;

      // SGK/yan haklar katsayısı
      const benefitsMultiplier =
        staff.benefits_multiplier || this.config.default_benefits_multiplier;

      const dailyCost = baseDailyCost * shiftMultiplier * benefitsMultiplier;

      dailyCosts[staff.role] = dailyCost;
      dailyTotal += dailyCost;
    }

    const serviceDaysPerWeek =
      input.service_days_per_week || this.config.default_service_days_per_week;
    const totalServiceDays = (input.duration_days / 7) * serviceDaysPerWeek;

    return {
      daily: dailyTotal,
      total: dailyTotal * totalServiceDays,
      per_person: (dailyTotal * totalServiceDays) / input.persons,
      details: {
        ...dailyCosts,
        total_service_days: totalServiceDays,
        sgk_multiplier: this.config.default_benefits_multiplier,
      },
    };
  }

  /**
   * 3. Genel Gider (GG) Hesaplama
   */
  private calculateOverheadCost(
    materialCost: CostBreakdown,
    laborCost: CostBreakdown,
    input: SimulationInput
  ): CostBreakdown {
    // Taban = MM + İM
    const base = materialCost.total + laborCost.total;

    // Risk değerlendirmesi
    const riskLevel = this.assessRiskLevel(input);
    const overheadPercentage =
      riskLevel === "HIGH"
        ? this.config.overhead_percentages.high_risk
        : this.config.overhead_percentages.base;

    // GG = Taban × %X
    const overheadTotal = base * (overheadPercentage / 100);
    const overheadDaily =
      overheadTotal /
      ((input.duration_days / 7) * (input.service_days_per_week || 7));

    return {
      daily: overheadDaily,
      total: overheadTotal,
      per_person: overheadTotal / input.persons,
      details: {
        base_amount: base,
        overhead_percentage: overheadPercentage,
        risk_assessment:
          riskLevel === "HIGH" ? 1 : riskLevel === "MEDIUM" ? 2 : 3,
        formula_applied: overheadPercentage,
      },
    };
  }

  /**
   * 4. Bakım/Operasyon Maliyeti (BM) Hesaplama (opsiyonel)
   */
  private calculateMaintenanceCost(
    input: SimulationInput
  ): CostBreakdown | undefined {
    // Şimdilik basit implementasyon - gelecekte genişletilebilir
    if (input.duration_days > 365) {
      // 1 yıldan uzun projeler için
      const monthlyMaintenance = input.persons * 2; // Kişi başına 2 TL/ay bakım
      const totalMonths = Math.ceil(input.duration_days / 30);
      const maintenanceTotal = monthlyMaintenance * totalMonths;

      return {
        daily: maintenanceTotal / input.duration_days,
        total: maintenanceTotal,
        per_person: maintenanceTotal / input.persons,
        details: {
          monthly_rate: monthlyMaintenance,
          total_months: totalMonths,
          per_person_monthly: 2,
        },
      };
    }

    return undefined;
  }

  /**
   * 5. Kâr Hesaplama
   */
  private calculateProfit(
    projectTotal: number,
    input: SimulationInput
  ): { margin: number; percentage: number } {
    const riskLevel = this.assessRiskLevel(input);

    let profitPercentage: number;
    switch (riskLevel) {
      case "HIGH":
        profitPercentage = this.config.profit_margins.high_risk;
        break;
      case "LOW":
        profitPercentage = this.config.profit_margins.competitive;
        break;
      default:
        profitPercentage = this.config.profit_margins.standard;
    }

    const profitMargin = projectTotal * (profitPercentage / 100);

    return {
      margin: profitMargin,
      percentage: profitPercentage,
    };
  }

  /**
   * 6. KİK Analizi
   */
  private performKIKAnalysis(
    materialCost: CostBreakdown,
    laborCost: CostBreakdown,
    overheadCost: CostBreakdown,
    recommendedPrice: number
  ) {
    // K katsayısı: 0.93 (yemek alımı)
    const kFactor = this.config.k_factor;

    // Sınır değer: threshold_value_try = k_factor × (MM + İM + GG)
    const baseValue = materialCost.total + laborCost.total + overheadCost.total;
    const thresholdValueTry = kFactor * baseValue;

    // ADT tespiti: ÖF < threshold_value_try → explanation_required=true
    const explanationRequired = recommendedPrice < thresholdValueTry;

    // Risk seviyesi belirleme
    const priceRatio = recommendedPrice / thresholdValueTry;
    let riskLevel: "LOW" | "MEDIUM" | "HIGH";

    if (priceRatio < 0.85) {
      riskLevel = "HIGH";
    } else if (priceRatio < 0.95) {
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "LOW";
    }

    // KİK Kanıt İzi Logging
    const kikAuditTrail = {
      version: "kik-2025-v1",
      k_factor: kFactor,
      inputs: {
        material_cost: materialCost.total,
        labor_cost: laborCost.total,
        overhead_cost: overheadCost.total,
        base_value: baseValue,
        recommended_price: recommendedPrice,
      },
      formula: {
        threshold_calculation: `threshold = k_factor * (MM + İM + GG) = ${kFactor} × ${baseValue} = ${thresholdValueTry}`,
        adt_condition: `ÖF < threshold → ${recommendedPrice} < ${thresholdValueTry} = ${explanationRequired}`,
        price_ratio: priceRatio,
        risk_assessment: `ratio: ${priceRatio.toFixed(3)} → ${riskLevel}`,
      },
      result: {
        threshold_value_try: thresholdValueTry,
        explanation_required: explanationRequired,
        risk_level: riskLevel,
      },
      calculated_at: new Date().toISOString(),
    };

    // Log KİK analysis for audit purposes
    console.log(
      "KİK Analysis Audit Trail:",
      JSON.stringify(kikAuditTrail, null, 2)
    );

    return {
      k_factor: kFactor,
      threshold_value_try: thresholdValueTry,
      explanation_required: explanationRequired,
      risk_level: riskLevel,
      audit_trail: kikAuditTrail, // Include audit trail in response
    };
  }

  /**
   * Yardımcı fonksiyonlar
   */
  private validateAndComplete(input: SimulationInput): SimulationInput {
    // Zorunlu alanları kontrol et
    if (!input.persons || input.persons <= 0) {
      throw new Error("Geçerli kişi sayısı gerekli");
    }

    if (!input.meals_per_day || input.meals_per_day <= 0) {
      throw new Error("Geçerli günlük öğün sayısı gerekli");
    }

    if (!input.duration_days || input.duration_days <= 0) {
      throw new Error("Geçerli proje süresi gerekli");
    }

    if (!input.portion_specs || input.portion_specs.length === 0) {
      throw new Error("Porsiyon spesifikasyonları gerekli");
    }

    // Eksik opsiyonel alanları tamamla
    return {
      ...input,
      service_days_per_week:
        input.service_days_per_week ||
        this.config.default_service_days_per_week,
      confidence: input.confidence || 0.8, // Varsayılan orta güven
    };
  }

  private generateStaffing(personCount: number): StaffMember[] {
    const staffing: StaffMember[] = [];

    for (const [role, rules] of Object.entries(DEFAULT_STAFFING_RULES)) {
      const calculatedCount = Math.max(
        Math.ceil(personCount * rules.ratio_per_person),
        rules.min_count
      );

      staffing.push({
        role,
        count: calculatedCount,
        hours_per_day: rules.default_hours,
        hourly_wage: rules.default_wage,
        shift_multiplier: this.config.default_shift_multiplier,
        benefits_multiplier: this.config.default_benefits_multiplier,
      });
    }

    return staffing;
  }

  private assessRiskLevel(input: SimulationInput): "LOW" | "MEDIUM" | "HIGH" {
    let riskScore = 0;

    // Kişi sayısı riski
    if (input.persons > 1000) riskScore += 2;
    else if (input.persons > 500) riskScore += 1;

    // Süre riski
    if (input.duration_days > 365) riskScore += 2;
    else if (input.duration_days > 180) riskScore += 1;

    // Güven riski
    if (
      (input.confidence || 0.8) <
      this.config.confidence_thresholds.approval_gate
    )
      riskScore += 3;
    else if (
      (input.confidence || 0.8) <
      this.config.confidence_thresholds.high_confidence
    )
      riskScore += 1;

    // Risk seviyesi belirleme
    if (riskScore >= 4) return "HIGH";
    if (riskScore >= 2) return "MEDIUM";
    return "LOW";
  }

  private calculateConfidence(input: SimulationInput): number {
    let confidence = input.confidence || 0.8;

    // Veri tamlığına göre güven artırma/azaltma
    if (input.staffing && input.staffing.length > 0) confidence += 0.1;
    if (input.portion_specs.length >= 3) confidence += 0.05;
    if (input.location) confidence += 0.05;

    // Maksimum güven 1.0
    return Math.min(confidence, 1.0);
  }
}

/**
 * Hızlı simülasyon fonksiyonu - basit kullanım için
 */
export async function runCostSimulation(
  input: SimulationInput
): Promise<SimulationOutput> {
  const engine = new CostSimulationEngine();
  return engine.simulate(input);
}

/**
 * Yapılandırmalı simülasyon fonksiyonu
 */
export async function runCostSimulationWithConfig(
  input: SimulationInput,
  config: Partial<SimulationConfig>
): Promise<SimulationOutput> {
  const engine = new CostSimulationEngine(config);
  return engine.simulate(input);
}
