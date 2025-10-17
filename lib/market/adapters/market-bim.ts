import { MarketPrice } from "../core/types";

export async function fetchBIMPrices(): Promise<MarketPrice[]> {
  const today = new Date().toISOString().split("T")[0];

  // BİM market fiyatları (gerçek API entegrasyonu için placeholder)
  return [
    {
      source: "BİM",
      product: "Pirinç (Baldo)",
      unit: "kg",
      price: 41.8,
      date: today,
    },
    {
      source: "BİM",
      product: "Dana Kıyma",
      unit: "kg",
      price: 188.0,
      date: today,
    },
    {
      source: "BİM",
      product: "Tavuk But",
      unit: "kg",
      price: 87.9,
      date: today,
    },
    { source: "BİM", product: "Soğan", unit: "kg", price: 11.9, date: today },
    { source: "BİM", product: "Patates", unit: "kg", price: 19.2, date: today },
    { source: "BİM", product: "Domates", unit: "kg", price: 29.5, date: today },
    {
      source: "BİM",
      product: "Zeytinyağı",
      unit: "lt",
      price: 162.5,
      date: today,
    },
    { source: "BİM", product: "Şeker", unit: "kg", price: 30.8, date: today },
  ];
}
