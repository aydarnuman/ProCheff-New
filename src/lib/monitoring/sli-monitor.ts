/**
 * Production SLI/SLO Monitoring
 * Service Level Indicators for Pipeline Health
 */

import { PrismaClient } from "@prisma/client";
import { log } from "../utils/logger";

const prisma = new PrismaClient();

export interface SLI {
  name: string;
  description: string;
  target: number; // Target value (e.g., 0.99 for 99% availability)
  unit: "percentage" | "seconds" | "count" | "ratio";
  timeWindow: "1h" | "24h" | "7d" | "30d";
}

export interface SLIMetric {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
  details?: Record<string, unknown>;
}

export interface SLOStatus {
  sli: SLI;
  currentValue: number;
  target: number;
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  burnRate: number; // Error budget burn rate
  timeToExhaustion?: number; // Minutes until error budget exhausted
  measurements: SLIMetric[];
}

export class ProductionSLIMonitor {
  private static instance: ProductionSLIMonitor;
  private slis: Map<string, SLI> = new Map();

  public static getInstance(): ProductionSLIMonitor {
    if (!ProductionSLIMonitor.instance) {
      ProductionSLIMonitor.instance = new ProductionSLIMonitor();
      ProductionSLIMonitor.instance.initializeSLIs();
    }
    return ProductionSLIMonitor.instance;
  }

  /**
   * Initialize production SLIs
   */
  private initializeSLIs(): void {
    // Pipeline Availability SLI
    this.slis.set("pipeline_availability", {
      name: "pipeline_availability",
      description:
        "Pipeline step completion rate (successful / total attempts)",
      target: 0.99, // 99% success rate
      unit: "percentage",
      timeWindow: "24h",
    });

    // Pipeline Latency SLI
    this.slis.set("pipeline_latency_p95", {
      name: "pipeline_latency_p95",
      description: "95th percentile pipeline step execution time",
      target: 30, // 30 seconds max
      unit: "seconds",
      timeWindow: "24h",
    });

    // Guard Condition Success Rate
    this.slis.set("guard_success_rate", {
      name: "guard_success_rate",
      description: "Guard condition validation success rate",
      target: 0.95, // 95% of guard evaluations should pass
      unit: "percentage",
      timeWindow: "24h",
    });

    // Cost Simulation Accuracy SLI
    this.slis.set("cost_accuracy", {
      name: "cost_accuracy",
      description:
        "Cost simulations within reasonable bounds (50%-150% of estimate)",
      target: 0.9, // 90% of simulations should be reasonable
      unit: "percentage",
      timeWindow: "24h",
    });

    // Idempotency Compliance
    this.slis.set("idempotency_compliance", {
      name: "idempotency_compliance",
      description: "Duplicate requests handled correctly",
      target: 1.0, // 100% - critical for data integrity
      unit: "percentage",
      timeWindow: "24h",
    });

    // PT (Pipeline Timeline) Equality Assertion
    this.slis.set("pt_equality_compliance", {
      name: "pt_equality_compliance",
      description: "Pipeline steps complete in expected sequence",
      target: 0.98, // 98% sequence compliance
      unit: "percentage",
      timeWindow: "24h",
    });
  }

  /**
   * Record SLI measurement
   */
  async recordSLI(
    sliName: string,
    value: number,
    labels?: Record<string, string>,
    details?: Record<string, unknown>
  ): Promise<void> {
    const metric: SLIMetric = {
      name: sliName,
      value,
      timestamp: new Date(),
      labels,
      details,
    };

    // Store in database for persistence
    try {
      await prisma.sLIMetric.create({
        data: {
          name: sliName,
          value,
          timestamp: metric.timestamp,
          labels: labels || {},
          details: details || {},
        },
      });

      log.debug("SLI metric recorded", {
        sliName,
        value,
        labels,
        timestamp: metric.timestamp,
      });
    } catch (error) {
      log.error("Failed to record SLI metric", {
        sliName,
        value,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Calculate current SLO status
   */
  async calculateSLOStatus(
    sliName: string,
    timeWindow: "1h" | "24h" | "7d" | "30d" = "24h"
  ): Promise<SLOStatus | null> {
    const sli = this.slis.get(sliName);
    if (!sli) {
      log.warn("Unknown SLI requested", { sliName });
      return null;
    }

    // Calculate time window
    const windowMs = this.getTimeWindowMs(timeWindow);
    const since = new Date(Date.now() - windowMs);

    // Get measurements from database
    const measurements = await prisma.sLIMetric.findMany({
      where: {
        name: sliName,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: "desc" },
    });

    if (measurements.length === 0) {
      return {
        sli,
        currentValue: 0,
        target: sli.target,
        status: "CRITICAL",
        burnRate: 1.0,
        measurements: [],
      };
    }

    // Calculate current value based on SLI type
    const currentValue = this.calculateSLIValue(sliName, measurements);

    // Determine status
    const errorBudget = 1 - sli.target;
    const errorRate = Math.max(0, sli.target - currentValue);
    const burnRate = errorRate / errorBudget;

    let status: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";
    if (currentValue < sli.target * 0.9) {
      status = "CRITICAL";
    } else if (currentValue < sli.target * 0.95) {
      status = "WARNING";
    }

    // Calculate time to exhaustion if burn rate > 0
    let timeToExhaustion: number | undefined;
    if (burnRate > 0 && status !== "HEALTHY") {
      // Simplified calculation - assumes current burn rate continues
      const remainingBudget = Math.max(0, currentValue - sli.target);
      timeToExhaustion =
        ((remainingBudget / burnRate) * windowMs) / (1000 * 60); // minutes
    }

    const sloStatus: SLOStatus = {
      sli,
      currentValue,
      target: sli.target,
      status,
      burnRate,
      timeToExhaustion,
      measurements: measurements.map((m: SLIMetric) => ({
        name: m.name,
        value: m.value,
        timestamp: m.timestamp,
        labels: m.labels as Record<string, string>,
        details: m.details as Record<string, unknown>,
      })),
    };

    log.info("SLO status calculated", {
      sliName,
      currentValue,
      target: sli.target,
      status,
      burnRate,
      measurementsCount: measurements.length,
    });

    return sloStatus;
  }

  /**
   * Get all SLO statuses
   */
  async getAllSLOStatuses(
    timeWindow: "1h" | "24h" | "7d" | "30d" = "24h"
  ): Promise<SLOStatus[]> {
    const statuses: SLOStatus[] = [];

    for (const sliName of Array.from(this.slis.keys())) {
      const status = await this.calculateSLOStatus(sliName, timeWindow);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  /**
   * Record pipeline step completion
   */
  async recordPipelineStepCompletion(
    step: string,
    success: boolean,
    durationMs: number,
    docHash: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    // Record availability metric
    await this.recordSLI(
      "pipeline_availability",
      success ? 1 : 0,
      { step, docHash },
      { duration_ms: durationMs, ...details }
    );

    // Record latency metric (only for successful operations)
    if (success) {
      await this.recordSLI(
        "pipeline_latency_p95",
        durationMs / 1000, // Convert to seconds
        { step, docHash },
        details
      );
    }
  }

  /**
   * Record guard evaluation result
   */
  async recordGuardEvaluation(
    step: string,
    passed: boolean,
    confidence: number,
    docHash: string,
    blockersCount: number = 0
  ): Promise<void> {
    await this.recordSLI(
      "guard_success_rate",
      passed ? 1 : 0,
      { step, docHash },
      { confidence, blockers_count: blockersCount }
    );
  }

  /**
   * Record cost simulation accuracy
   */
  async recordCostAccuracy(
    tenderId: string,
    ratio: number,
    isReasonable: boolean,
    docHash: string
  ): Promise<void> {
    await this.recordSLI(
      "cost_accuracy",
      isReasonable ? 1 : 0,
      { tender_id: tenderId, docHash },
      { cost_ratio: ratio, reasonable_bounds: "0.5-1.5" }
    );
  }

  /**
   * Record idempotency check
   */
  async recordIdempotencyCheck(
    docHash: string,
    step: string,
    wasIdempotent: boolean,
    action: "created" | "found_existing" | "retry"
  ): Promise<void> {
    await this.recordSLI(
      "idempotency_compliance",
      wasIdempotent ? 1 : 0,
      { step, docHash, action },
      { action }
    );
  }

  /**
   * Record PT equality assertion
   */
  async recordPTEqualityAssertion(
    docHash: string,
    expectedStep: string,
    actualStep: string,
    sequenceValid: boolean
  ): Promise<void> {
    await this.recordSLI(
      "pt_equality_compliance",
      sequenceValid ? 1 : 0,
      { docHash, expected_step: expectedStep, actual_step: actualStep },
      { sequence_validation: sequenceValid }
    );
  }

  /**
   * Calculate SLI value based on measurements
   */
  private calculateSLIValue(
    sliName: string,
    measurements: SLIMetric[]
  ): number {
    if (measurements.length === 0) return 0;

    switch (sliName) {
      case "pipeline_availability":
      case "guard_success_rate":
      case "cost_accuracy":
      case "idempotency_compliance":
      case "pt_equality_compliance":
        // Success rate calculation
        const successCount = measurements.filter((m) => m.value === 1).length;
        return successCount / measurements.length;

      case "pipeline_latency_p95":
        // P95 latency calculation
        const sortedValues = measurements
          .map((m) => m.value)
          .sort((a, b) => a - b);
        const p95Index = Math.floor(sortedValues.length * 0.95);
        return sortedValues[p95Index] || 0;

      default:
        // Default to average
        return (
          measurements.reduce((sum, m) => sum + m.value, 0) /
          measurements.length
        );
    }
  }

  /**
   * Convert time window string to milliseconds
   */
  private getTimeWindowMs(timeWindow: string): number {
    switch (timeWindow) {
      case "1h":
        return 60 * 60 * 1000;
      case "24h":
        return 24 * 60 * 60 * 1000;
      case "7d":
        return 7 * 24 * 60 * 60 * 1000;
      case "30d":
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }
}

/**
 * Global SLI recording functions
 */
export const sliMonitor = ProductionSLIMonitor.getInstance();

export async function recordPipelineStepSLI(
  step: string,
  success: boolean,
  durationMs: number,
  docHash: string,
  details?: Record<string, unknown>
): Promise<void> {
  return sliMonitor.recordPipelineStepCompletion(
    step,
    success,
    durationMs,
    docHash,
    details
  );
}

export async function recordGuardSLI(
  step: string,
  passed: boolean,
  confidence: number,
  docHash: string,
  blockersCount: number = 0
): Promise<void> {
  return sliMonitor.recordGuardEvaluation(
    step,
    passed,
    confidence,
    docHash,
    blockersCount
  );
}

export async function recordCostAccuracySLI(
  tenderId: string,
  ratio: number,
  isReasonable: boolean,
  docHash: string
): Promise<void> {
  return sliMonitor.recordCostAccuracy(tenderId, ratio, isReasonable, docHash);
}

export async function getSLODashboard(
  timeWindow: "1h" | "24h" | "7d" | "30d" = "24h"
): Promise<{
  overall: "HEALTHY" | "WARNING" | "CRITICAL";
  slos: SLOStatus[];
  summary: {
    healthy: number;
    warning: number;
    critical: number;
  };
}> {
  const slos = await sliMonitor.getAllSLOStatuses(timeWindow);

  const summary = {
    healthy: slos.filter((s) => s.status === "HEALTHY").length,
    warning: slos.filter((s) => s.status === "WARNING").length,
    critical: slos.filter((s) => s.status === "CRITICAL").length,
  };

  let overall: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";
  if (summary.critical > 0) {
    overall = "CRITICAL";
  } else if (summary.warning > 0) {
    overall = "WARNING";
  }

  return {
    overall,
    slos,
    summary,
  };
}
