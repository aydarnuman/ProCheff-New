// PDF Processing Health Check API
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

interface HealthMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  lastProcessedAt?: string;
  errorTypes: Record<string, number>;
}

class HealthChecker {
  private static logPath = path.join(process.cwd(), "logs", "pdf-analysis.log");

  static async getHealthMetrics(): Promise<HealthMetrics> {
    const metrics: HealthMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      errorTypes: {},
    };

    try {
      if (!fs.existsSync(this.logPath)) {
        return metrics;
      }

      const logContent = fs.readFileSync(this.logPath, "utf-8");
      const logLines = logContent.split("\n").filter((line) => line.trim());

      const processingTimes: number[] = [];
      let lastProcessedTimestamp: string | undefined;

      for (const line of logLines) {
        try {
          const logEntry = JSON.parse(line);

          if (logEntry.message === "PDF analiz isteği başlıyor") {
            metrics.totalRequests++;
          }

          if (logEntry.message === "PDF analizi başarıyla tamamlandı") {
            metrics.successfulRequests++;
            lastProcessedTimestamp = logEntry.timestamp;

            // Extract processing time
            if (logEntry.data?.processingTime) {
              const timeStr = logEntry.data.processingTime.replace("ms", "");
              const time = parseInt(timeStr);
              if (!isNaN(time)) {
                processingTimes.push(time);
              }
            }
          }

          if (logEntry.level === "ERROR") {
            metrics.failedRequests++;

            // Categorize errors
            const errorType = logEntry.data?.type || "Unknown";
            metrics.errorTypes[errorType] =
              (metrics.errorTypes[errorType] || 0) + 1;
          }
        } catch (parseError) {
          // Skip malformed log entries
          continue;
        }
      }

      metrics.lastProcessedAt = lastProcessedTimestamp;

      if (processingTimes.length > 0) {
        metrics.averageProcessingTime = Math.round(
          processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        );
      }

      return metrics;
    } catch (error) {
      console.error("Health check error:", error);
      return metrics;
    }
  }

  static getHealthStatus(
    metrics: HealthMetrics
  ): "healthy" | "warning" | "critical" {
    const successRate =
      metrics.totalRequests > 0
        ? (metrics.successfulRequests / metrics.totalRequests) * 100
        : 100;

    if (successRate >= 95) return "healthy";
    if (successRate >= 80) return "warning";
    return "critical";
  }

  static generateRecommendations(metrics: HealthMetrics): string[] {
    const recommendations: string[] = [];

    const successRate =
      metrics.totalRequests > 0
        ? (metrics.successfulRequests / metrics.totalRequests) * 100
        : 100;

    if (successRate < 95) {
      recommendations.push(
        `Başarı oranı %${successRate.toFixed(1)} - İyileştirme gerekli`
      );
    }

    if (metrics.averageProcessingTime > 10000) {
      recommendations.push(
        `Ortalama işlem süresi ${metrics.averageProcessingTime}ms - Performans optimizasyonu gerekli`
      );
    }

    if (metrics.errorTypes["TypeError"] > 0) {
      recommendations.push("TypeScript tip hatalarını giderin");
    }

    if (metrics.errorTypes["Error"] > 5) {
      recommendations.push("Sık görülen hataları analiz edin ve düzeltin");
    }

    if (!metrics.lastProcessedAt) {
      recommendations.push(
        "Sistem henüz test edilmedi - Test dosyası yükleyin"
      );
    }

    return recommendations;
  }
}

export async function GET(request: NextRequest) {
  try {
    const metrics = await HealthChecker.getHealthMetrics();
    const status = HealthChecker.getHealthStatus(metrics);
    const recommendations = HealthChecker.generateRecommendations(metrics);

    const response = {
      status,
      timestamp: new Date().toISOString(),
      metrics,
      recommendations,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        arch: process.arch,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        status: "critical",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
