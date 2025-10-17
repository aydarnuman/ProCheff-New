import { MarketPrice } from "../core/types";

export async function fetchSOKPrices(): Promise<MarketPrice[]> {
  const today = new Date().toISOString().split("T")[0];

  // ŞOK market fiyatları (gerçek API entegrasyonu için placeholder)
  return [
    {
      source: "ŞOK",
      product: "Pirinç (Baldo)",
      unit: "kg",
      price: 43.2,
      date: today,
    },
    {
      source: "ŞOK",
      product: "Dana Kıyma",
      unit: "kg",
      price: 189.2,
      date: today,
    },
    {
      source: "ŞOK",
      product: "Tavuk But",
      unit: "kg",
      price: 88.7,
      date: today,
    },
    { source: "ŞOK", product: "Soğan", unit: "kg", price: 12.1, date: today },
    { source: "ŞOK", product: "Patates", unit: "kg", price: 18.9, date: today },
    { source: "ŞOK", product: "Domates", unit: "kg", price: 28.2, date: today },
    {
      source: "ŞOK",
      product: "Zeytinyağı",
      unit: "lt",
      price: 164.8,
      date: today,
    },
    { source: "ŞOK", product: "Şeker", unit: "kg", price: 31.2, date: today },
  ];
}
