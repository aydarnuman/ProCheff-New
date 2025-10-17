import { MarketPrice, AveragePrice } from "./types";

export function calculateAveragePrices(prices: MarketPrice[]): AveragePrice[] {
  const grouped: Record<string, MarketPrice[]> = {};

  for (const item of prices) {
    const key = item.product + "|" + item.unit;
    grouped[key] = grouped[key] || [];
    grouped[key].push(item);
  }

  const results: AveragePrice[] = [];

  for (const key of Object.keys(grouped)) {
    const [product, unit] = key.split("|");
    const entries = grouped[key];
    const avg = entries.reduce((sum, p) => sum + p.price, 0) / entries.length;
    results.push({
      product,
      unit,
      average: Number(avg.toFixed(2)),
      sources: entries.map((e) => ({ name: e.source, price: e.price })),
    });
  }

  return results;
}
