import { OfferInput, OfferResult } from "./types";

export function calculateOffer(input: OfferInput): OfferResult {
  const { materialCost, laborCost, overheadRate, profitRate } = input;

  const overhead = (materialCost + laborCost) * (overheadRate / 100);
  const subtotal = materialCost + laborCost + overhead;
  const profit = subtotal * (profitRate / 100);
  const totalCost = subtotal + profit;

  // KİK yemek alımı için K=0.93
  const k = 0.93;
  const threshold = totalCost / k;
  const belowThreshold = totalCost < threshold * k;

  return {
    totalCost: Number(totalCost.toFixed(2)),
    offerPrice: Number(threshold.toFixed(2)),
    kThreshold: k,
    belowThreshold,
    detail: {
      material: Number(materialCost.toFixed(2)),
      labor: Number(laborCost.toFixed(2)),
      overhead: Number(overhead.toFixed(2)),
      profit: Number(profit.toFixed(2)),
    },
  };
}
