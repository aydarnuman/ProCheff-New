/**
 * ProCheff Monitoring & Metrics Middleware
 * Performance tracking ve business metrics
 */

import { log } from "../utils/logger";

export interface RequestMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  contentLength?: number;
}

// In-memory metrics storage (production'da time-series DB kullanılabilir)
const metricsStorage = new Map<string, RequestMetrics[]>();

/**
 * Request tracking class
 */
class RequestTracker {
  private metrics: RequestMetrics;
  private request: Request;

  constructor(request: Request) {
    this.request = request;
    this.metrics = {
      startTime: Date.now(),
      endpoint: new URL(request.url).pathname,
      method: request.method,
      memoryUsage: process.memoryUsage(),
    };
  }

  finish(response: Response): void {
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    this.metrics.statusCode = response.status;
    this.metrics.contentLength = parseInt(response.headers.get("content-length") || "0");

    // Metrics'i store et
    const key = `${this.metrics.method}:${this.metrics.endpoint}`;
    if (!metricsStorage.has(key)) {
      metricsStorage.set(key, []);
    }

    const endpointMetrics = metricsStorage.get(key)!;
    endpointMetrics.push(this.metrics);

    // Son 100 kaydı tut (memory management)
    if (endpointMetrics.length > 100) {
      endpointMetrics.shift();
    }

    // HTTP request logla
    log.httpRequest(this.request, response, this.metrics.duration);

    // Business metrics
    this.trackBusinessMetrics();

    // Performance warnings
    this.checkPerformanceThresholds();
  }

  private trackBusinessMetrics(): void {
    const { endpoint, method, statusCode, duration } = this.metrics;

    // API endpoint usage
    log.businessMetric("api.request.count", 1, {
      endpoint,
      method,
      statusCode,
    });

    // Response time
    log.businessMetric("api.response.time", duration!, {
      endpoint,
      method,
    });

    // Error rate
    if (statusCode! >= 400) {
      log.businessMetric("api.error.count", 1, {
        endpoint,
        method,
        statusCode,
      });
    }

    // Success rate
    if (statusCode! < 400) {
      log.businessMetric("api.success.count", 1, {
        endpoint,
        method,
      });
    }

    // Memory usage
    const memoryMB = this.metrics.memoryUsage!.heapUsed / 1024 / 1024;
    log.businessMetric("system.memory.heap", memoryMB);
  }

  private checkPerformanceThresholds(): void {
    const { duration, endpoint, memoryUsage } = this.metrics;

    // Slow request warning (>2 saniye)
    if (duration! > 2000) {
      log.warn("Slow request detected", {
        endpoint,
        duration,
        threshold: 2000,
      });
    }

    // High memory usage warning (>500MB)
    const memoryMB = memoryUsage!.heapUsed / 1024 / 1024;
    if (memoryMB > 500) {
      log.warn("High memory usage detected", {
        endpoint,
        memoryUsage: memoryMB,
        threshold: 500,
      });
    }
  }
}

/**
 * Monitoring middleware wrapper
 */
export function withMonitoring(handler: (request: Request, ...args: any[]) => Promise<Response>) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    const tracker = new RequestTracker(request);

    try {
      const response = await handler(request, ...args);
      tracker.finish(response);
      return response;
    } catch (error) {
      // Error durumunda da tracking yap
      const errorResponse = new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Internal server error",
            code: 500,
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );

      tracker.finish(errorResponse);
      throw error; // Error boundary yakalayacak
    }
  };
}

/**
 * Metrics summary getter
 */
export function getMetricsSummary(): Record<
  string,
  {
    count: number;
    avgDuration: number;
    errorRate: number;
    lastSeen: string;
  }
> {
  const summary: Record<string, any> = {};

  metricsStorage.forEach((metrics: RequestMetrics[], endpoint: string) => {
    const durations = metrics.map((m: RequestMetrics) => m.duration!);
    const errors = metrics.filter((m: RequestMetrics) => m.statusCode! >= 400);

    summary[endpoint] = {
      count: metrics.length,
      avgDuration: Math.round(
        durations.reduce((a: number, b: number) => a + b, 0) / durations.length
      ),
      errorRate: Math.round((errors.length / metrics.length) * 100),
      lastSeen: new Date(Math.max(...metrics.map((m: RequestMetrics) => m.endTime!))).toISOString(),
    };
  });

  return summary;
}

/**
 * Health metrics for monitoring systems
 */
export function getHealthMetrics(): {
  requests: {
    total: number;
    errors: number;
    avgResponseTime: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
} {
  const allMetrics = Array.from(metricsStorage.values()).flat();
  const errors = allMetrics.filter((m) => m.statusCode! >= 400);
  const durations = allMetrics.map((m) => m.duration!).filter((d) => d > 0);

  const memUsage = process.memoryUsage();
  const memTotal = memUsage.heapTotal;
  const memUsed = memUsage.heapUsed;

  return {
    requests: {
      total: allMetrics.length,
      errors: errors.length,
      avgResponseTime:
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0,
    },
    memory: {
      used: Math.round(memUsed / 1024 / 1024), // MB
      total: Math.round(memTotal / 1024 / 1024), // MB
      percentage: Math.round((memUsed / memTotal) * 100),
    },
    uptime: Math.round(process.uptime()),
  };
}
