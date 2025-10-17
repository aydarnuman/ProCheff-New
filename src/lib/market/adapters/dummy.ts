import { MarketPrice } from "../core/types";

export async function fetchDummyPrices(): Promise<MarketPrice[]> {
  const today = new Date().toISOString().split("T")[0];
  return [
    {
      source: "A101",
      product: "Pirinç (Baldo)",
      unit: "kg",
      price: 42.3,
      date: today,
    },
    {
      source: "BİM",
      product: "Pirinç (Baldo)",
      unit: "kg",
      price: 41.8,
      date: today,
    },
    {
      source: "ŞOK",
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
      source: "A101",
      product: "Dana Kıyma",
      unit: "kg",
      price: 185.9,
      date: today,
    },
    {
      source: "BİM",
      product: "Dana Kıyma",
      unit: "kg",
      price: 188.0,
      date: today,
    },
  ];
}
