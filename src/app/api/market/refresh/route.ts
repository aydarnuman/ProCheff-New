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

export async function POST() {
  try {
    const startTime = Date.now();
    log.info("Starting scheduled market price refresh");

    // Tüm marketlerden fresh data çek
    const [a101Prices, bimPrices, migrosPrices, sokPrices] = await Promise.all([
      fetchA101Prices(),
      fetchBIMPrices(),
      fetchMigrosPrices(),
      fetchSOKPrices(),
    ]);

    const allPrices = [
      ...a101Prices,
      ...bimPrices,
      ...migrosPrices,
      ...sokPrices,
    ];

    const averagePrices = calculateAveragePrices(allPrices);
    const duration = Date.now() - startTime;

    const result = {
      status: "success",
      refreshedAt: new Date().toISOString(),
      duration: `${duration}ms`,
      stats: {
        markets: 4,
        products: averagePrices.length,
        rawPrices: allPrices.length,
      },
      summary: averagePrices.map((p) => ({
        product: p.product,
        unit: p.unit,
        average: p.average,
        sourceCount: p.sources.length,
      })),
    };

    log.info("Market price refresh completed", {
      duration,
      products: averagePrices.length,
      markets: 4,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    log.error("Market price refresh failed", { err: err.message });
    return NextResponse.json(
      { error: "Fiyat yenileme başarısız", detail: err.message },
      { status: 500 }
    );
  }
}
