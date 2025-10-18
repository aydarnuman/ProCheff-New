import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/errorHandler";

export const dynamic = "force-dynamic";

/**
 * Service health check functions
 */
async function checkPdfService(): Promise<{
  status: boolean;
  details?: string;
}> {
  try {
    // PDF parser'ın temel bileşenlerini kontrol et
    const { ingestPDF } = await import("@/lib/ingest");
    return { status: true };
  } catch (error) {
    return {
      status: false,
      details: error instanceof Error ? error.message : "PDF service check failed",
    };
  }
}

async function checkMenuService(): Promise<{
  status: boolean;
  details?: string;
}> {
  try {
    // Menu analysis modülünü kontrol et
    const { analyzeMenu } = await import("@/lib/menu/analyze");

    // Basit bir test yap
    const testResult = analyzeMenu("Test menü\nKuru fasulye (protein 10, yağ 5, karbonhidrat 20)");
    return {
      status: testResult.totalItems > 0,
      details: `Processed ${testResult.totalItems} items`,
    };
  } catch (error) {
    return {
      status: false,
      details: error instanceof Error ? error.message : "Menu service check failed",
    };
  }
}

async function checkOfferService(): Promise<{
  status: boolean;
  details?: string;
}> {
  try {
    // Offer calculation modülünü kontrol et
    const { calculateOffer } = await import("@/lib/offer/calc");

    // Basit bir test yap
    const testResult = calculateOffer({
      materialCost: 100,
      laborCost: 50,
      overheadRate: 0.15,
      profitRate: 0.2,
    });

    return {
      status: testResult.offerPrice > 0,
      details: `Test calculation: ${testResult.offerPrice} TL`,
    };
  } catch (error) {
    return {
      status: false,
      details: error instanceof Error ? error.message : "Offer service check failed",
    };
  }
}

async function checkMarketService(): Promise<{
  status: boolean;
  details?: string;
}> {
  try {
    // Market intelligence modülünü kontrol et
    const { fetchA101Prices, fetchBIMPrices } = await import("@/lib/market");

    const testResult = await fetchA101Prices();

    return {
      status: testResult.length > 0,
      details: `${testResult.length} A101 price points available`,
    };
  } catch (error) {
    return {
      status: false,
      details: error instanceof Error ? error.message : "Market service check failed",
    };
  }
}

// Enhanced health check handler
async function handleHealthCheck(request: Request) {
  try {
    const startTime = Date.now();
    const env = getEnv();

    // Paralel service checks
    const [pdfCheck, menuCheck, offerCheck, marketCheck] = await Promise.all([
      checkPdfService(),
      checkMenuService(),
      checkOfferService(),
      checkMarketService(),
    ]);

    const allServicesHealthy = [pdfCheck, menuCheck, offerCheck, marketCheck].every(
      (check) => check.status
    );

    const responseTime = Date.now() - startTime;

    const healthData = {
      status: allServicesHealthy ? "healthy" : "degraded",
      service: "procheff",
      version: process.env.GIT_SHA || "dev",
      nodeEnv: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks: {
        pdf: pdfCheck,
        menu: menuCheck,
        offer: offerCheck,
        market: marketCheck,
        environment: {
          status: true,
          details: `Running on ${env.NODE_ENV}`,
        },
      },
    };

    log.info("Health check completed", {
      status: healthData.status,
      responseTime,
      servicesCount: 4,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: healthData,
      }),
      {
        status: allServicesHealthy ? 200 : 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    log.error("Health check failed", { error });
    throw error;
  }
}

// Güvenlik middleware ile wrapped handler (rate limit biraz daha gevşek)
export const GET = withSecurity(handleHealthCheck, {
  allowedMethods: ["GET"],
  rateLimit: false, // Health check için rate limit yok
});
