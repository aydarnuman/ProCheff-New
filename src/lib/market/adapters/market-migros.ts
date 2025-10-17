import { MarketPrice } from "../core/types";

export async function fetchMigrosPrices(): Promise<MarketPrice[]> {
  const today = new Date().toISOString().split("T")[0];

  // Migros market fiyatları (gerçek API entegrasyonu için placeholder)
  return [
    {
      source: "Migros",
      product: "Pirinç (Baldo)",
      unit: "kg",
      price: 43.2,
      date: today,
    },
    {
      source: "Migros",
      product: "Dana Kıyma",
      unit: "kg",
      price: 187.5,
      date: today,
    },
    {
      source: "Migros",
      product: "Tavuk But",
      unit: "kg",
      price: 91.2,
      date: today,
    },
    {
      source: "Migros",
      product: "Soğan",
      unit: "kg",
      price: 13.5,
      date: today,
    },
    {
      source: "Migros",
      product: "Patates",
      unit: "kg",
      price: 17.8,
      date: today,
    },
    {
      source: "Migros",
      product: "Domates",
      unit: "kg",
      price: 27.5,
      date: today,
    },
    {
      source: "Migros",
      product: "Zeytinyağı",
      unit: "lt",
      price: 168.9,
      date: today,
    },
    {
      source: "Migros",
      product: "Şeker",
      unit: "kg",
      price: 32.1,
      date: today,
    },
  ];
}
