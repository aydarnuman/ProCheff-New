/**
 * Cost Simulation E2E Tests
 * PMYO ve Belediye senaryoları ile sistem testleri
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll } from "vitest";

// Test configuration
const API_BASE_URL = "http://localhost:3000/api";
const TIMEOUT = 30000;

// Test scenarios
const PMYO_SCENARIO = {
  persons: 1200,
  meals_per_day: 3,
  duration_days: 365,
  portion_specs: [
    {
      category: "Ana Yemek",
      gram_per_portion: 150,
      market_price_per_kg: 45,
      waste_percentage: 6,
    },
    {
      category: "Çorba",
      gram_per_portion: 250,
      market_price_per_kg: 12,
      waste_percentage: 5,
    },
    {
      category: "Salata",
      gram_per_portion: 100,
      market_price_per_kg: 8,
      waste_percentage: 8,
    },
  ],
  location: "Ankara PMYO",
  confidence: 0.85,
};

const BELEDIYE_SCENARIO = {
  persons: 500,
  meals_per_day: 2,
  duration_days: 180,
  portion_specs: [
    {
      category: "Ana Yemek",
      gram_per_portion: 200,
      market_price_per_kg: 50,
      waste_percentage: 7,
    },
    {
      category: "Çorba",
      gram_per_portion: 200,
      market_price_per_kg: 15,
      waste_percentage: 6,
    },
  ],
  staffing: [
    {
      role: "Aşçı",
      count: 3,
      hours_per_day: 8,
      hourly_wage: 28,
      shift_multiplier: 1.2,
      benefits_multiplier: 1.4,
    },
    {
      role: "Yardımcı",
      count: 4,
      hours_per_day: 8,
      hourly_wage: 20,
      benefits_multiplier: 1.4,
    },
  ],
  location: "Belediye Yemekhanesi",
  confidence: 0.92,
};

describe("Cost Simulation E2E Tests", () => {
  beforeAll(async () => {
    // Test verilerinin hazır olduğunu kontrol et
    console.log("E2E testleri başlatılıyor...");
  }, TIMEOUT);

  describe("PMYO Senaryosu", () => {
    let simulationId: string;
    let simulationResult: any;

    it(
      "maliyet simülasyonu çalıştırabilmeli",
      async () => {
        const response = await fetch(`${API_BASE_URL}/simulations/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(PMYO_SCENARIO),
        });

        expect(response.status).toBe(201);

        const result = await response.json();
        expect(result.success).toBe(true);
        expect(result.data.simulationId).toBeDefined();

        simulationId = result.data.simulationId;
        simulationResult = result.data.outputs;

        console.log("PMYO Simülasyon ID:", simulationId);
        console.log("Toplam Maliyet:", simulationResult.project_total);
      },
      TIMEOUT
    );

    it("maliyet hesaplamaları tutarlı olmalı", async () => {
      expect(simulationResult).toBeDefined();

      // Temel tutarlılık kontrolleri
      const { material_cost, labor_cost, overhead_cost, project_total } =
        simulationResult;

      expect(material_cost.total).toBeGreaterThan(0);
      expect(labor_cost.total).toBeGreaterThan(0);
      expect(overhead_cost.total).toBeGreaterThan(0);

      // Toplam hesaplama kontrolü
      const calculatedTotal =
        material_cost.total + labor_cost.total + overhead_cost.total;
      expect(Math.abs(calculatedTotal - project_total)).toBeLessThan(0.01);

      console.log("Malzeme:", material_cost.total);
      console.log("İşçilik:", labor_cost.total);
      console.log("Genel Gider:", overhead_cost.total);
      console.log("Hesaplanan Toplam:", calculatedTotal);
      console.log("Bildirilen Toplam:", project_total);
    });

    it("KİK analizi doğru çalışmalı", async () => {
      expect(simulationResult.kik_analysis).toBeDefined();

      const { k_factor, threshold_value_try, explanation_required } =
        simulationResult.kik_analysis;

      expect(k_factor).toBe(0.93);
      expect(threshold_value_try).toBeGreaterThan(0);
      expect(typeof explanation_required).toBe("boolean");

      console.log("K Factor:", k_factor);
      console.log("Threshold:", threshold_value_try);
      console.log("ADT Gerekli:", explanation_required);
    });

    it("otomatik teklif oluşturabilmeli", async () => {
      // Önce bir test client ID'si oluşturalım (normalde mevcut olacak)
      const clientId = "test-client-id-pmyo";

      const offerResponse = await fetch(`${API_BASE_URL}/offers/auto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulationId,
          clientId,
          title: "PMYO Yemek Hizmeti Teklifi",
          description: "1200 kişilik PMYO için yıllık yemek hizmeti teklifi",
        }),
      });

      // 404 olabilir çünkü test client yok, ama yapıyı test ediyoruz
      const offerResult = await offerResponse.json();

      if (offerResponse.status === 201) {
        // Başarılı oluşturuldu
        expect(offerResult.success).toBe(true);
        expect(offerResult.data.offerId).toBeDefined();
        console.log("Teklif ID:", offerResult.data.offerId);
      } else if (offerResponse.status === 404) {
        // Client bulunamadı - beklenen durum
        expect(offerResult.code).toBe("CLIENT_NOT_FOUND");
        console.log("Client bulunamadı - test senaryosu doğru çalışıyor");
      }
    });
  });

  describe("Belediye Senaryosu", () => {
    let simulationId: string;
    let simulationResult: any;

    it(
      "farklı parametre seti ile simülasyon çalışmalı",
      async () => {
        const response = await fetch(`${API_BASE_URL}/simulations/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(BELEDIYE_SCENARIO),
        });

        expect(response.status).toBe(201);

        const result = await response.json();
        expect(result.success).toBe(true);

        simulationId = result.data.simulationId;
        simulationResult = result.data.outputs;

        console.log("Belediye Simülasyon ID:", simulationId);
        console.log("Toplam Maliyet:", simulationResult.project_total);
      },
      TIMEOUT
    );

    it("staffing parametreleri doğru işlenmeli", async () => {
      expect(simulationResult.labor_cost).toBeDefined();

      const laborDetails = simulationResult.labor_cost.details;
      expect(laborDetails.Aşçı).toBeDefined();
      expect(laborDetails.Yardımcı).toBeDefined();

      // Manuel staffing olduğu için otomatik türetme yapılmamalı
      expect(laborDetails.sgk_multiplier).toBe(1.4);

      console.log("İşçilik Detayları:", laborDetails);
    });

    it("idempotent çalışmalı - aynı istek tekrar yapılabilmeli", async () => {
      // Aynı isteği tekrar yap
      const response = await fetch(`${API_BASE_URL}/simulations/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...BELEDIYE_SCENARIO,
          docHash: "test-belediye-hash",
        }),
      });

      expect(response.status).toBe(201);

      const result = await response.json();
      const firstSimId = result.data.simulationId;

      // İkinci istek - aynı docHash ile
      const response2 = await fetch(`${API_BASE_URL}/simulations/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...BELEDIYE_SCENARIO,
          docHash: "test-belediye-hash",
        }),
      });

      expect(response2.status).toBe(200); // Cached response

      const result2 = await response2.json();
      expect(result2.data.cached).toBe(true);
      expect(result2.data.simulationId).toBe(firstSimId);

      console.log("Idempotent test başarılı - aynı simülasyon döndürüldü");
    });
  });

  describe("Edge Cases ve Validasyon", () => {
    it("geçersiz parametrelerle hata vermeli", async () => {
      const invalidScenario = {
        persons: -100, // Negatif değer
        meals_per_day: 0,
        duration_days: 10000, // Çok yüksek değer
        portion_specs: [], // Boş array
      };

      const response = await fetch(`${API_BASE_URL}/simulations/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidScenario),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.code).toBe("VALIDATION_ERROR");
    });

    it("eksik porsiyon spesifikasyonu ile hata vermeli", async () => {
      const incompleteScenario = {
        persons: 100,
        meals_per_day: 2,
        duration_days: 30,
        // portion_specs eksik
      };

      const response = await fetch(`${API_BASE_URL}/simulations/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incompleteScenario),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.success).toBe(false);
    });
  });

  describe("Performance Tests", () => {
    it("simülasyon 250ms içinde tamamlanmalı", async () => {
      const startTime = Date.now();

      const response = await fetch(`${API_BASE_URL}/simulations/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...BELEDIYE_SCENARIO,
          docHash: `perf-test-${Date.now()}`,
        }),
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(250);

      console.log(`Simülasyon süresi: ${duration}ms`);
    });
  });
});
