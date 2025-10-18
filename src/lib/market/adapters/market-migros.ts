import { MarketPrice } from "../core/types";

export async function fetchMigrosPrices(): Promise<MarketPrice[]> {
  const today = new Date().toISOString().split("T")[0];
  
  return [
    {
      source: "Migros",
      product: "Pirinç (Baldo)", 
      unit: "kg",
      price: 43.2,
      date: today,
      confidence: 0.8
    }
  ];
}
