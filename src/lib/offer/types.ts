export interface OfferInput {
  materialCost: number; // malzeme maliyeti (menü + fiyatlardan)
  laborCost: number; // işçilik
  overheadRate: number; // genel gider oranı (%)
  profitRate: number; // kâr oranı (%)
}

export interface OfferResult {
  totalCost: number; // toplam maliyet
  offerPrice: number; // teklif birim fiyat
  kThreshold: number; // K faktörü (0.93)
  belowThreshold: boolean; // aşırı düşük riski
  detail: {
    material: number;
    labor: number;
    overhead: number;
    profit: number;
  };
}
