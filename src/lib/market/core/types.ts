export interface MarketPrice {
  source: string;
  product: string;
  unit: string;
  price: number;
  date: string;
  confidence?: number; // 0-1 arası güven skoru
}

export interface AveragePrice {
  product: string;
  unit: string;
  average: number;
  sources: { name: string; price: number }[];
}
