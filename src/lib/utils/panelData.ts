import { PanelData } from "./types";
import { MenuAnalysis } from "@/lib/menu/types";
import { OfferResult } from "@/lib/offer/types";
import { AveragePrice } from "@/lib/market/core/types";

export function generatePanelData(
  menuAnalysis: MenuAnalysis,
  offerResult: OfferResult,
  marketPrices: AveragePrice[],
  processingStart: number
): PanelData {
  const duration = Date.now() - processingStart;

  // Risk assessment
  const nutritionalRisks = menuAnalysis.warnings;
  const financialRisks: string[] = [];
  const complianceRisks: string[] = [];

  if (offerResult.belowThreshold) {
    complianceRisks.push("KİK K=0.93 sınırının altında");
  }

  if (offerResult.detail.material > offerResult.totalCost * 0.7) {
    financialRisks.push("Malzeme maliyeti yüksek (>%70)");
  }

  if (offerResult.detail.profit < offerResult.totalCost * 0.05) {
    financialRisks.push("Kar marjı çok düşük (<5%)");
  }

  // Confidence calculation
  const hasNutritionData = menuAnalysis.totalItems > 0;
  const hasPriceData = marketPrices.length > 0;
  const confidence =
    (hasNutritionData ? 40 : 0) +
    (hasPriceData ? 40 : 0) +
    (nutritionalRisks.length === 0 ? 10 : 0) +
    (financialRisks.length === 0 ? 10 : 0);

  return {
    menu: {
      type: menuAnalysis.menuType,
      items: menuAnalysis.totalItems,
      nutrition: {
        protein: menuAnalysis.macroBalance.protein,
        fat: menuAnalysis.macroBalance.fat,
        carb: menuAnalysis.macroBalance.carb,
      },
      warnings: nutritionalRisks,
    },
    costs: {
      material: offerResult.detail.material,
      labor: offerResult.detail.labor,
      overhead: offerResult.detail.overhead,
      total: offerResult.totalCost,
    },
    profit: {
      rate: Math.round(
        (offerResult.detail.profit / offerResult.totalCost) * 100
      ),
      amount: offerResult.detail.profit,
    },
    threshold: {
      kFactor: offerResult.kThreshold,
      limit: offerResult.offerPrice,
      belowThreshold: offerResult.belowThreshold,
    },
    risks: {
      nutritional: nutritionalRisks,
      financial: financialRisks,
      compliance: complianceRisks,
    },
    offer: {
      finalPrice: offerResult.offerPrice,
      currency: "TL",
      perUnit: "portion",
    },
    meta: {
      processedAt: new Date().toISOString(),
      duration: `${duration}ms`,
      confidence: confidence,
    },
  };
}
