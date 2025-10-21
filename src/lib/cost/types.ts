/**
 * ProCheff Cost Simulation Types
 * Maliyet simülasyonu için temel tipler
 */

// Giriş verileri - analysis_v1 uyumlu
export interface SimulationInput {
  // Zorunlu alanlar
  persons: number; // Kişi sayısı
  meals_per_day: number; // Günlük öğün sayısı
  duration_days: number; // Proje süresi (gün)
  portion_specs: PortionSpec[]; // Porsiyon spesifikasyonları

  // Opsiyonel alanlar
  staffing?: StaffMember[]; // Personel kadrosu
  service_days_per_week?: number; // Haftalık hizmet günü (varsayılan: 7)
  hygiene_standards?: string[]; // Hijyen standartları
  location?: string; // Lokasyon

  // Sistem alanları
  doc_hash?: string; // Idempotent operasyonlar için
  confidence?: number; // Veri güveni (0.0-1.0)
}

export interface PortionSpec {
  category: string; // "Ana Yemek", "Çorba", "Salata"
  gram_per_portion: number; // Porsiyon başına gram
  market_price_per_kg: number; // Market fiyatı (TL/kg)
  waste_percentage?: number; // İsraf yüzdesi (varsayılan: 6%)
}

export interface StaffMember {
  role: string; // "Aşçı", "Yardımcı", "Temizlik"
  count: number; // Kişi sayısı
  hours_per_day: number; // Günlük çalışma saati
  hourly_wage: number; // Saatlik ücret (TL)
  shift_multiplier?: number; // Vardiya katsayısı (varsayılan: 1.0)
  benefits_multiplier?: number; // SGK/yan haklar (varsayılan: 1.4)
}

// Çıktı verileri - KİK uyumlu
export interface SimulationOutput {
  // Ana maliyet kalemleri
  material_cost: CostBreakdown; // Malzeme Maliyeti (MM)
  labor_cost: CostBreakdown; // İşçilik Maliyeti (İM)
  overhead_cost: CostBreakdown; // Genel Gider (GG)
  maintenance_cost?: CostBreakdown; // Bakım Maliyeti (BM)

  // Toplam ve öneriler
  project_total: number; // Proje Toplamı (PT)
  recommended_price: number; // Önerilen Fiyat (ÖF)
  profit_margin: number; // Kâr marjı (TL)
  profit_percentage: number; // Kâr yüzdesi (%)

  // KİK bilgileri
  kik_analysis: {
    k_factor: number; // 0.93
    threshold_value_try: number; // ADT sınır değeri
    explanation_required: boolean; // ADT gerekli mi?
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    audit_trail?: {
      version: string;
      k_factor: number;
      inputs: Record<string, number>;
      formula: Record<string, string | number>;
      result: Record<string, string | number | boolean>;
      calculated_at: string;
    };
  };

  // KİK Özet Bilgisi
  kik_summary: {
    compliant: boolean; // ADT gereksinimini karşılıyor mu?
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    threshold_ratio: string; // ÖF / threshold oranı
    audit_version: string; // Denetim versiyonu
  };

  // Meta bilgiler
  confidence: number; // Hesaplama güveni
  calculated_at: string; // Hesaplama zamanı
  version: string; // Hesaplama versiyonu
}

export interface CostBreakdown {
  daily: number; // Günlük maliyet
  total: number; // Toplam maliyet
  per_person: number; // Kişi başına maliyet
  details: Record<string, number>; // Alt kalem detayları
}

// Yapılandırma sabitleri
export interface SimulationConfig {
  // Varsayılan değerler
  default_waste_percentage: number; // %6
  default_service_days_per_week: number; // 7
  default_shift_multiplier: number; // 1.0
  default_benefits_multiplier: number; // 1.4 (SGK + yan haklar)

  // KİK sabitleri
  k_factor: number; // 0.93

  // Genel gider oranları
  overhead_percentages: {
    base: number; // Temel GG oranı (%)
    high_risk: number; // Yüksek risk GG oranı (%)
  };

  // Kâr marjı önerileri
  profit_margins: {
    standard: number; // Standart kâr (%)
    high_risk: number; // Yüksek risk kâr (%)
    competitive: number; // Rekabetçi kâr (%)
  };

  // Güven eşikleri
  confidence_thresholds: {
    approval_gate: number; // 0.75 - Onay kapısı eşiği
    high_confidence: number; // 0.90 - Yüksek güven
  };
}

// Varsayılan yapılandırma
export const DEFAULT_CONFIG: SimulationConfig = {
  default_waste_percentage: 6, // %6 israf
  default_service_days_per_week: 7,
  default_shift_multiplier: 1.0,
  default_benefits_multiplier: 1.4,

  k_factor: 0.93,

  overhead_percentages: {
    base: 12, // %12 GG
    high_risk: 18, // %18 GG (yüksek risk)
  },

  profit_margins: {
    standard: 15, // %15 kâr
    high_risk: 20, // %20 kâr
    competitive: 10, // %10 kâr
  },

  confidence_thresholds: {
    approval_gate: 0.75,
    high_confidence: 0.9,
  },
};

// Personel türetme kuralları
export interface StaffingRules {
  [key: string]: {
    ratio_per_person: number; // Kişi başına gerekli sayı
    min_count: number; // Minimum personel sayısı
    default_hours: number; // Varsayılan günlük saat
    default_wage: number; // Varsayılan saatlik ücret
  };
}

export const DEFAULT_STAFFING_RULES: StaffingRules = {
  Aşçı: {
    ratio_per_person: 1 / 200, // 1 aşçı / 200 kişi
    min_count: 1,
    default_hours: 8,
    default_wage: 25, // 25 TL/saat
  },
  Yardımcı: {
    ratio_per_person: 1 / 150, // 1 yardımcı / 150 kişi
    min_count: 1,
    default_hours: 8,
    default_wage: 18, // 18 TL/saat
  },
  Temizlik: {
    ratio_per_person: 1 / 300, // 1 temizlik / 300 kişi
    min_count: 1,
    default_hours: 6,
    default_wage: 15, // 15 TL/saat
  },
};
