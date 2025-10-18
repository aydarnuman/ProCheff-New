import { getEnv } from "@/lib/env";
import { log } from "@/lib/utils/logger";
import { respond } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// Basit health check
async function handleHealthCheck(): Promise<Response> {
  try {
    const startTime = Date.now();
    const env = getEnv();

    // Temel service checks
    const checks = {
      pdf: await checkService(() => import("@/lib/ingest")),
      menu: await checkService(() => import("@/lib/menu/analyze")),
      offer: await checkService(() => import("@/lib/offer/calc")),
      market: await checkService(() => import("@/lib/market")),
    };

    const allHealthy = Object.values(checks).every((check) => check.status);
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: allHealthy ? "healthy" : "degraded",
      service: "procheff",
      version: process.env.GIT_SHA || "dev",
      environment: env.NODE_ENV,
      uptime: Math.round(process.uptime()),
      responseTime: `${responseTime}ms`,
      checks,
      timestamp: new Date().toISOString(),
    };

    log.info("Health check completed", {
      status: healthData.status,
      responseTime,
    });

    return respond.ok(healthData, undefined, {
      uptime: healthData.uptime,
      environment: env.NODE_ENV,
    });
  } catch (error: any) {
    log.error("Health check failed", { error: error.message });
    return respond.serverError("Health check failed");
  }
}

// Helper function for service checks
async function checkService(
  importFn: () => Promise<any>
): Promise<{ status: boolean; details?: string }> {
  try {
    await importFn();
    return { status: true, details: "OK" };
  } catch (error: any) {
    return {
      status: false,
      details: error.message || "Service check failed",
    };
  }
}

// Rate limit yok - health check serbestçe erişilebilir
export const GET = handleHealthCheck;
