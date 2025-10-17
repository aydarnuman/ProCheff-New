export interface MarketPrice {
  source: string;
  product: string;
  unit: string;
  price: number;
  date: string;
}

export interface AveragePrice {
  product: string;
  unit: string;
  average: number;
  sources: { name: string; price: number }[];
}
