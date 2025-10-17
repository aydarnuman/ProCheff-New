import { calculateOffer } from "@/lib/offer/calc";
import { runReasoning } from "@/lib/reasoning/core/engine";
import { MenuAnalysis } from "@/lib/menu/types";
import { OfferResult } from "@/lib/offer/types";

export interface SimulationInput {
  menu: MenuAnalysis;
  offer: OfferResult;
  adjustments: {
    proteinDelta?: number; // örn: +10 → protein oranını %10 artır
    carbDelta?: number; // örn: -5 → karbonhidratı %5 azalt
    profitRateDelta?: number; // örn: +2 → kâr marjını 2 puan artır
  };
}

export interface SimulationResult {
  newMenu: MenuAnalysis;
  newOffer: OfferResult;
  reasoning: ReturnType<typeof runReasoning>;
}

export function runSimulation(input: SimulationInput): SimulationResult {
  const { menu, offer, adjustments } = input;

  // Besin oranlarını güncelle
  const newProtein = Math.max(
    0,
    menu.macroBalance.protein + (adjustments.proteinDelta || 0)
  );
  const newCarb = Math.max(
    0,
    menu.macroBalance.carb + (adjustments.carbDelta || 0)
  );
  const fat = 100 - (newProtein + newCarb);
  const newMenu = {
    ...menu,
    macroBalance: { protein: newProtein, fat, carb: newCarb },
  };

  // Yeni teklif hesapla
  const newProfitRate =
    (offer.detail.profit / offer.totalCost) * 100 +
    (adjustments.profitRateDelta || 0);
  const newOffer = calculateOffer({
    materialCost: offer.detail.material,
    laborCost: offer.detail.labor,
    overheadRate:
      (offer.detail.overhead / (offer.detail.material + offer.detail.labor)) *
      100,
    profitRate: newProfitRate,
  });

  // Yeni reasoning üret
  const reasoning = runReasoning(newMenu, newOffer);

  return { newMenu, newOffer, reasoning };
}
