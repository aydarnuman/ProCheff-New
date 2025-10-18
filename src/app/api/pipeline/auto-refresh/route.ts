import { NextResponse } from "next/server";
import { fetchDummyPrices } from "@/lib/market/adapters/dummy";
import { calculateAveragePrices } from "@/lib/market/core/aggregator";
import { calculateOffer } from "@/lib/offer/calc";
import { log } from "@/lib/utils/logger";
import { ok, fail } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    log.info("Otomatik market ve teklif yenileme başlatıldı");

    // 1. Güncel market fiyatlarını çek
    const prices = await fetchDummyPrices();
    const averages = calculateAveragePrices(prices);

    // 2. Gramaj oranlarına göre malzeme maliyetini hesapla (şartname sabit)
    const rice = averages.find((p) => p.product.includes("Pirinç"))?.average ?? 42;
    const meat = averages.find((p) => p.product.includes("Dana Kıyma"))?.average ?? 187;
    const onion = averages.find((p) => p.product.includes("Soğan"))?.average ?? 15;
    const oil = averages.find((p) => p.product.includes("Ayçiçek Yağı"))?.average ?? 85;

    // Gramaj oranları sabit (KİK spesifikasyonu)
    const materialCost = rice * 0.15 + meat * 0.3 + onion * 0.08 + oil * 0.05;

    // 3. Güncel teklif fiyatını hesapla (K=0.93)
    const offer = calculateOffer({
      materialCost,
      laborCost: 4.5, // Sabit işçilik oranı
      overheadRate: 5, // Sabit genel gider
      profitRate: 8, // Sabit kâr marjı
    });

    const refreshData = {
      updatedAt: new Date().toISOString(),
      materialCost: Math.round(materialCost * 100) / 100,
      offer: {
        totalCost: Math.round(offer.totalCost * 100) / 100,
        offerPrice: Math.round(offer.offerPrice * 100) / 100,
        kThreshold: offer.kThreshold,
      },
      marketPrices: {
        rice,
        meat,
        onion,
        oil,
      },
    };

    log.info("Otomatik teklif hesaplandı", {
      materialCost: refreshData.materialCost,
      offerPrice: refreshData.offer.offerPrice,
    });

    return NextResponse.json(
      ok({
        refresh: refreshData,
      })
    );
  } catch (err: any) {
    log.error("Otomatik yenileme hatası", { err: err.message });
    return NextResponse.json(fail("Auto-refresh başarısız", 500, err.message));
  }
}
