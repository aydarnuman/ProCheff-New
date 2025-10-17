/**
 * ProCheff Metrics & Analytics Endpoint
 * System health ve performance metrics
 */

import {
  getMetricsSummary,
  getHealthMetrics,
} from "@/lib/middleware/monitoring";
import { withMetricsEndpoint, type AuthContext } from "@/lib/middleware";
import { log } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

async function handleMetrics(
  request: Request,
  context?: AuthContext
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "summary";

    log.info("Metrics request", {
      type,
      keyId: context?.apiKey?.id,
      keyName: context?.apiKey?.name,
    });

    let data: any;

    switch (type) {
      case "health":
        data = getHealthMetrics();
        break;

      case "endpoints":
        data = getMetricsSummary();
        break;

      case "summary":
      default:
        data = {
          health: getHealthMetrics(),
          endpoints: getMetricsSummary(),
          timestamp: new Date().toISOString(),
          system: {
            nodeVersion: process.version,
            platform: process.platform,
            uptime: Math.round(process.uptime()),
            environment: process.env.NODE_ENV || "development",
          },
        };
        break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        meta: {
          requestedBy: context?.apiKey?.name || "anonymous",
          generatedAt: new Date().toISOString(),
          type,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    log.error("Metrics endpoint error", { error });
    throw error;
  }
}

// Admin-only metrics endpoint
export const GET = withMetricsEndpoint(handleMetrics);
