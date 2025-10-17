import { NextResponse } from "next/server";
import {
  fetchA101Prices,
  fetchBIMPrices,
  fetchMigrosPrices,
  fetchSOKPrices,
  calculateAveragePrices,
} from "@/lib/market";
import { log } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    log.info("Fetching prices from all markets");

    // Tüm marketlerden fiyatları paralel çek
    const [a101Prices, bimPrices, migrosPrices, sokPrices] = await Promise.all([
      fetchA101Prices(),
      fetchBIMPrices(),
      fetchMigrosPrices(),
      fetchSOKPrices(),
    ]);

    // Tüm fiyatları birleştir
    const allPrices = [
      ...a101Prices,
      ...bimPrices,
      ...migrosPrices,
      ...sokPrices,
    ];

    // Ortalama fiyatları hesapla
    const averagePrices = calculateAveragePrices(allPrices);

    const result = {
      meta: {
        sources: ["A101", "BİM", "Migros", "ŞOK"],
        totalProducts: averagePrices.length,
        lastUpdated: new Date().toISOString(),
        rawPricesCount: allPrices.length,
      },
      averagePrices,
      rawPrices: allPrices,
    };

    log.info("Market prices fetched successfully", {
      products: averagePrices.length,
      sources: 4,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    log.error("Market prices fetch failed", { err: err.message });
    return NextResponse.json(
      { error: "Fiyat verisi alınamadı", detail: err.message },
      { status: 500 }
    );
  }
}
