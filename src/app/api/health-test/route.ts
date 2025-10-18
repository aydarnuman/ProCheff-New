import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Simple health check for production testing
 * No environment validation required
 */
async function handleHealthCheck(): Promise<Response> {
  try {
    const startTime = Date.now();

    // Basic service availability checks without API key validation
    const checks = {
      pdf: await checkService(() => import("@/lib/ingest")),
      menu: await checkService(() => import("@/lib/menu/core")),
      offer: await checkService(() => import("@/lib/offer")),
      server: { status: true, details: "Server is running" },
    };

    const allHealthy = Object.values(checks).every((check) => check.status);
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: allHealthy ? "healthy" : "degraded",
      service: "procheff",
      version: process.env.GIT_SHA || "dev",
      environment: process.env.NODE_ENV || "production",
      uptime: Math.round(process.uptime()),
      responseTime: `${responseTime}ms`,
      checks,
      timestamp: new Date().toISOString(),
      mode: "test-friendly",
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error: any) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        service: "procheff",
        error: error.message,
        timestamp: new Date().toISOString(),
        mode: "test-friendly",
      },
      { status: 500 }
    );
  }
}

// Helper function for service checks
async function checkService(serviceImport: () => Promise<any>): Promise<{
  status: boolean;
  details?: string;
}> {
  try {
    await serviceImport();
    return { status: true };
  } catch (error) {
    return {
      status: false,
      details: error instanceof Error ? error.message : "Service check failed",
    };
  }
}

export async function GET(request: Request) {
  return handleHealthCheck();
}
