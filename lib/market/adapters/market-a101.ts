import { MarketPrice } from "../core/types";

export async function fetchA101Prices(): Promise<MarketPrice[]> {
  const today = new Date().toISOString().split("T")[0];

  // A101 market fiyatları (gerçek API entegrasyonu için placeholder)
  return [
    {
      source: "A101",
      product: "Pirinç (Baldo)",
      unit: "kg",
      price: 42.3,
      date: today,
    },
    {
      source: "A101",
      product: "Dana Kıyma",
      unit: "kg",
      price: 185.9,
      date: today,
    },
    {
      source: "A101",
      product: "Tavuk But",
      unit: "kg",
      price: 89.5,
      date: today,
    },
    { source: "A101", product: "Soğan", unit: "kg", price: 12.8, date: today },
    {
      source: "A101",
      product: "Patates",
      unit: "kg",
      price: 18.5,
      date: today,
    },
    {
      source: "A101",
      product: "Domates",
      unit: "kg",
      price: 28.9,
      date: today,
    },
    {
      source: "A101",
      product: "Zeytinyağı",
      unit: "lt",
      price: 165.0,
      date: today,
    },
    { source: "A101", product: "Şeker", unit: "kg", price: 31.5, date: today },
  ];
}
