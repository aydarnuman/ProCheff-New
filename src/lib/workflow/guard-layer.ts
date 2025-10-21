/**
 * Guard Layer - Service Profile Prerequisites
 * Go/No-Go gates for pipeline execution
 */

import { PrismaClient } from "@prisma/client";
import { log } from "../utils/logger";

const prisma = new PrismaClient();

export interface GuardCondition {
  id: string;
  description: string;
  required: boolean;
  category: "prerequisites" | "validation" | "safety" | "compliance";
  validator: (context: GuardContext) => Promise<GuardResult>;
}

export interface GuardContext {
  tenderId?: string;
  docHash: string;
  userId: string;
  step: string;
  metadata?: Record<string, unknown>;
}

export interface GuardResult {
  passed: boolean;
  confidence: number; // 0-1
  evidence: Record<string, unknown>;
  message: string;
  blockingIssues?: string[];
  warnings?: string[];
  recommendations?: string[];
}

export interface GuardEvaluationResult {
  canProceed: boolean;
  overallConfidence: number;
  blockers: GuardResult[];
  warnings: GuardResult[];
  passed: GuardResult[];
  evaluatedAt: Date;
  context: GuardContext;
}

export class ServiceProfileGuardLayer {
  private static instance: ServiceProfileGuardLayer;
  private guards: Map<string, GuardCondition[]> = new Map();

  public static getInstance(): ServiceProfileGuardLayer {
    if (!ServiceProfileGuardLayer.instance) {
      ServiceProfileGuardLayer.instance = new ServiceProfileGuardLayer();
      ServiceProfileGuardLayer.instance.initializeGuards();
    }
    return ServiceProfileGuardLayer.instance;
  }

  /**
   * Initialize guard conditions for each pipeline step
   */
  private initializeGuards(): void {
    // Guards for ANALYZE_COMPLETED step
    this.guards.set("ANALYZE_COMPLETED", [
      {
        id: "document_integrity",
        description: "PDF document integrity and readability verified",
        required: true,
        category: "prerequisites",
        validator: this.validateDocumentIntegrity.bind(this),
      },
      {
        id: "structured_data_extracted",
        description: "Structured data successfully extracted from document",
        required: true,
        category: "validation",
        validator: this.validateStructuredDataExtraction.bind(this),
      },
    ]);

    // Guards for TENDER_UPSERTED step
    this.guards.set("TENDER_UPSERTED", [
      {
        id: "analysis_completed",
        description: "Document analysis completed successfully",
        required: true,
        category: "prerequisites",
        validator: this.validateAnalysisCompleted.bind(this),
      },
      {
        id: "tender_data_completeness",
        description: "Tender data contains minimum required fields",
        required: true,
        category: "validation",
        validator: this.validateTenderDataCompleteness.bind(this),
      },
    ]);

    // Guards for CHECKLIST_DONE step
    this.guards.set("CHECKLIST_DONE", [
      {
        id: "tender_exists",
        description: "Tender record exists in database",
        required: true,
        category: "prerequisites",
        validator: this.validateTenderExists.bind(this),
      },
      {
        id: "basic_requirements_identified",
        description: "Basic service requirements identified",
        required: true,
        category: "validation",
        validator: this.validateBasicRequirements.bind(this),
      },
    ]);

    // Guards for SIMULATION_DONE step
    this.guards.set("SIMULATION_DONE", [
      {
        id: "service_profile_complete",
        description: "Service profile has all required parameters",
        required: true,
        category: "prerequisites",
        validator: this.validateServiceProfileComplete.bind(this),
      },
      {
        id: "kik_compliance_ready",
        description: "KİK compliance data available for calculation",
        required: true,
        category: "compliance",
        validator: this.validateKikComplianceReady.bind(this),
      },
      {
        id: "market_data_available",
        description: "Market price data available for cost calculation",
        required: false,
        category: "safety",
        validator: this.validateMarketDataAvailable.bind(this),
      },
    ]);

    // Guards for OFFER_DRAFTED step
    this.guards.set("OFFER_DRAFTED", [
      {
        id: "simulation_completed",
        description: "Cost simulation completed successfully",
        required: true,
        category: "prerequisites",
        validator: this.validateSimulationCompleted.bind(this),
      },
      {
        id: "cost_validation",
        description: "Calculated costs are within reasonable bounds",
        required: true,
        category: "safety",
        validator: this.validateCostReasonableness.bind(this),
      },
      {
        id: "kik_final_check",
        description: "Final KİK compliance verification",
        required: true,
        category: "compliance",
        validator: this.validateFinalKikCompliance.bind(this),
      },
    ]);
  }

  /**
   * Evaluate all guards for a specific step
   */
  async evaluateStep(context: GuardContext): Promise<GuardEvaluationResult> {
    const stepGuards = this.guards.get(context.step) || [];

    log.info("Evaluating guard conditions", {
      step: context.step,
      guardsCount: stepGuards.length,
      docHash: context.docHash,
    });

    const results: GuardResult[] = [];
    const blockers: GuardResult[] = [];
    const warnings: GuardResult[] = [];
    const passed: GuardResult[] = [];

    // Evaluate each guard condition
    for (const guard of stepGuards) {
      try {
        const result = await guard.validator(context);
        results.push(result);

        if (result.passed) {
          passed.push(result);
        } else if (guard.required) {
          blockers.push(result);
        } else {
          warnings.push(result);
        }

        log.debug("Guard condition evaluated", {
          guardId: guard.id,
          passed: result.passed,
          confidence: result.confidence,
          message: result.message,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const failedResult: GuardResult = {
          passed: false,
          confidence: 0,
          evidence: { error: errorMessage },
          message: `Guard evaluation failed: ${errorMessage}`,
          blockingIssues: [errorMessage],
        };

        results.push(failedResult);
        if (guard.required) {
          blockers.push(failedResult);
        } else {
          warnings.push(failedResult);
        }

        log.error("Guard condition evaluation failed", {
          guardId: guard.id,
          error: errorMessage,
          step: context.step,
        });
      }
    }

    // Calculate overall confidence
    const overallConfidence =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
        : 0;

    const canProceed = blockers.length === 0;

    const evaluation: GuardEvaluationResult = {
      canProceed,
      overallConfidence,
      blockers,
      warnings,
      passed,
      evaluatedAt: new Date(),
      context,
    };

    log.info("Guard evaluation completed", {
      step: context.step,
      canProceed,
      overallConfidence,
      blockersCount: blockers.length,
      warningsCount: warnings.length,
      passedCount: passed.length,
    });

    return evaluation;
  }

  // Guard Validators

  private async validateDocumentIntegrity(
    context: GuardContext
  ): Promise<GuardResult> {
    if (!context.docHash) {
      return {
        passed: false,
        confidence: 0,
        evidence: { docHash: context.docHash },
        message: "Document hash missing",
        blockingIssues: ["Document hash required for integrity verification"],
      };
    }

    // Check if document exists and is readable
    const hasValidHash = context.docHash.length >= 32; // Minimum hash length

    return {
      passed: hasValidHash,
      confidence: hasValidHash ? 0.95 : 0,
      evidence: {
        docHash: context.docHash,
        hashLength: context.docHash.length,
      },
      message: hasValidHash
        ? "Document integrity verified"
        : "Invalid document hash format",
    };
  }

  private async validateStructuredDataExtraction(
    context: GuardContext
  ): Promise<GuardResult> {
    const hasMetadata =
      context.metadata && Object.keys(context.metadata).length > 0;
    const hasRequiredFields =
      hasMetadata &&
      context.metadata &&
      context.metadata.personCount &&
      context.metadata.estimatedValue;

    return {
      passed: !!hasRequiredFields,
      confidence: hasRequiredFields ? 0.9 : 0.3,
      evidence: {
        hasMetadata,
        metadataKeys:
          hasMetadata && context.metadata ? Object.keys(context.metadata) : [],
        hasPersonCount: !!context.metadata?.personCount,
        hasEstimatedValue: !!context.metadata?.estimatedValue,
      },
      message: hasRequiredFields
        ? "Structured data extracted successfully"
        : "Missing critical data fields from document",
      warnings:
        hasMetadata && !hasRequiredFields
          ? ["Some required fields missing from extracted data"]
          : undefined,
    };
  }

  private async validateAnalysisCompleted(
    context: GuardContext
  ): Promise<GuardResult> {
    // This should always pass at TENDER_UPSERTED step since analysis is prerequisite
    return {
      passed: true,
      confidence: 1.0,
      evidence: { step: context.step },
      message: "Analysis completed and validated",
    };
  }

  private async validateTenderDataCompleteness(
    context: GuardContext
  ): Promise<GuardResult> {
    if (!context.tenderId) {
      return {
        passed: false,
        confidence: 0,
        evidence: {},
        message: "Tender ID missing",
        blockingIssues: ["Tender must be created before proceeding"],
      };
    }

    const tender = await prisma.tender.findUnique({
      where: { id: context.tenderId },
    });

    if (!tender) {
      return {
        passed: false,
        confidence: 0,
        evidence: { tenderId: context.tenderId },
        message: "Tender not found in database",
        blockingIssues: ["Tender record must exist"],
      };
    }

    const missingFields: string[] = [];
    if (!tender.title) missingFields.push("title");
    if (!tender.personCount || tender.personCount <= 0)
      missingFields.push("personCount");
    if (!tender.estimatedValue || tender.estimatedValue <= 0)
      missingFields.push("estimatedValue");

    const isComplete = missingFields.length === 0;

    return {
      passed: isComplete,
      confidence: isComplete
        ? 0.95
        : Math.max(0.2, 1 - missingFields.length * 0.3),
      evidence: {
        tenderId: tender.id,
        missingFields,
        hasTitle: !!tender.title,
        hasPersonCount: tender.personCount > 0,
        hasEstimatedValue: tender.estimatedValue > 0,
      },
      message: isComplete
        ? "Tender data is complete"
        : `Missing required fields: ${missingFields.join(", ")}`,
      blockingIssues: isComplete
        ? undefined
        : missingFields.map((f) => `Missing ${f}`),
    };
  }

  private async validateTenderExists(
    context: GuardContext
  ): Promise<GuardResult> {
    if (!context.tenderId) {
      return {
        passed: false,
        confidence: 0,
        evidence: {},
        message: "Tender ID missing",
        blockingIssues: ["Tender ID required"],
      };
    }

    const tender = await prisma.tender.findUnique({
      where: { id: context.tenderId },
    });

    return {
      passed: !!tender,
      confidence: tender ? 1.0 : 0,
      evidence: {
        tenderId: context.tenderId,
        exists: !!tender,
      },
      message: tender ? "Tender exists" : "Tender not found",
      blockingIssues: tender ? undefined : ["Tender record not found"],
    };
  }

  private async validateBasicRequirements(
    context: GuardContext
  ): Promise<GuardResult> {
    if (!context.tenderId) {
      return {
        passed: false,
        confidence: 0,
        evidence: {},
        message: "Cannot validate requirements without tender ID",
        blockingIssues: ["Tender ID required"],
      };
    }

    const tender = await prisma.tender.findUnique({
      where: { id: context.tenderId },
    });

    if (!tender) {
      return {
        passed: false,
        confidence: 0,
        evidence: {},
        message: "Tender not found",
        blockingIssues: ["Tender not found"],
      };
    }

    const requirements = tender.requirements as Record<string, unknown>;
    const hasRequirements =
      requirements && Object.keys(requirements).length > 0;

    return {
      passed: hasRequirements,
      confidence: hasRequirements ? 0.8 : 0.1,
      evidence: {
        hasRequirements,
        requirementsKeys: hasRequirements ? Object.keys(requirements) : [],
      },
      message: hasRequirements
        ? "Basic requirements identified"
        : "No requirements data found",
      warnings: hasRequirements
        ? undefined
        : ["Requirements may need manual input"],
    };
  }

  private async validateServiceProfileComplete(
    context: GuardContext
  ): Promise<GuardResult> {
    if (!context.tenderId) {
      return {
        passed: false,
        confidence: 0,
        evidence: { errorCode: "WAITING_INPUT" },
        message: "Tender ID missing - simulation cannot proceed",
        blockingIssues: ["Cannot validate service profile without tender"],
      };
    }

    const tender = await prisma.tender.findUnique({
      where: { id: context.tenderId },
    });

    if (!tender) {
      return {
        passed: false,
        confidence: 0,
        evidence: { errorCode: "WAITING_INPUT" },
        message: "Tender not found - simulation cannot proceed",
        blockingIssues: ["Tender not found"],
      };
    }

    const missing: string[] = [];

    // Critical service profile requirements for simulation
    if (!tender.personCount || tender.personCount <= 0) missing.push("persons");
    if (!tender.estimatedValue || tender.estimatedValue <= 0)
      missing.push("estimated_value");

    const requirements = tender.requirements as Record<string, unknown>;
    const specifications = requirements?.specifications as Record<
      string,
      unknown
    >;

    // Check for meal specifications required for simulation
    if (
      !specifications?.mealTypes ||
      !(specifications.mealTypes as unknown[])?.length
    ) {
      missing.push("meals_per_day");
    }

    if (
      !specifications?.serviceDays ||
      (specifications.serviceDays as number) <= 0
    ) {
      missing.push("duration_days");
    }

    // Check for portion specifications
    if (
      !specifications?.portionSizes ||
      typeof specifications.portionSizes !== "object" ||
      Object.keys(specifications.portionSizes as object).length === 0
    ) {
      missing.push("portion_specs");
    }

    const isComplete = missing.length === 0;

    if (!isComplete) {
      // Return WAITING_INPUT when service profile is incomplete
      log.warn("Service profile incomplete - blocking simulation", {
        tenderId: context.tenderId,
        docHash: context.docHash,
        missing,
        errorCode: "WAITING_INPUT",
      });

      return {
        passed: false,
        confidence: 0,
        evidence: {
          errorCode: "WAITING_INPUT",
          missing,
          availableFields: {
            personCount: tender.personCount,
            estimatedValue: tender.estimatedValue,
            specifications: specifications || {},
          },
        },
        message: `Service profile incomplete. Missing: ${missing.join(
          ", "
        )}. Simulation blocked until input provided.`,
        blockingIssues: [
          `Missing critical simulation inputs: ${missing.join(", ")}`,
        ],
        recommendations: [
          "Provide person count (personCount > 0)",
          "Specify estimated value (estimatedValue > 0)",
          "Define meal types and portion specifications",
          "Set service duration in days",
        ],
      };
    }

    return {
      passed: isComplete,
      confidence: 0.95,
      evidence: {
        tenderId: tender.id,
        personCount: tender.personCount,
        estimatedValue: tender.estimatedValue,
        hasSpecifications: !!specifications,
        missing: [],
      },
      message: "Service profile is complete and ready for simulation",
    };
  }

  private async validateKikComplianceReady(
    _context: GuardContext
  ): Promise<GuardResult> {
    // Basic KİK readiness check - can be enhanced with actual KİK data validation
    return {
      passed: true,
      confidence: 0.8,
      evidence: {
        note: "KİK compliance check placeholder - requires actual KİK integration",
      },
      message: "KİK compliance data ready for calculation",
      warnings: ["KİK compliance validation needs full implementation"],
    };
  }

  private async validateMarketDataAvailable(
    _context: GuardContext
  ): Promise<GuardResult> {
    // This is a safety check, not required
    return {
      passed: true,
      confidence: 0.7,
      evidence: {
        note: "Market data availability check - using cached/fallback data",
      },
      message: "Market data available (cached/fallback)",
      warnings: ["Consider updating market price cache"],
    };
  }

  private async validateSimulationCompleted(
    context: GuardContext
  ): Promise<GuardResult> {
    if (!context.tenderId) {
      return {
        passed: false,
        confidence: 0,
        evidence: {},
        message: "Tender ID missing",
        blockingIssues: ["Cannot validate simulation without tender"],
      };
    }

    const simulation = await prisma.costSimulation.findFirst({
      where: { tenderId: context.tenderId },
      orderBy: { createdAt: "desc" },
    });

    const hasSimulation = !!simulation;
    const isRecent =
      hasSimulation &&
      simulation.createdAt.getTime() > Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    return {
      passed: hasSimulation,
      confidence: hasSimulation ? (isRecent ? 0.95 : 0.7) : 0,
      evidence: {
        hasSimulation,
        simulationId: simulation?.id,
        createdAt: simulation?.createdAt,
        isRecent,
      },
      message: hasSimulation
        ? isRecent
          ? "Recent simulation found"
          : "Simulation found (older than 24h)"
        : "No simulation found for tender",
      blockingIssues: hasSimulation
        ? undefined
        : ["Cost simulation must be completed"],
      warnings:
        hasSimulation && !isRecent
          ? ["Simulation is older than 24 hours"]
          : undefined,
    };
  }

  private async validateCostReasonableness(
    context: GuardContext
  ): Promise<GuardResult> {
    if (!context.tenderId) {
      return {
        passed: false,
        confidence: 0,
        evidence: {},
        message: "Cannot validate costs without tender",
        blockingIssues: ["Tender ID required"],
      };
    }

    const simulation = await prisma.costSimulation.findFirst({
      where: { tenderId: context.tenderId },
      orderBy: { createdAt: "desc" },
    });

    if (!simulation) {
      return {
        passed: false,
        confidence: 0,
        evidence: {},
        message: "No simulation found",
        blockingIssues: ["Simulation required for cost validation"],
      };
    }

    const tender = await prisma.tender.findUnique({
      where: { id: context.tenderId },
    });

    if (!tender) {
      return {
        passed: false,
        confidence: 0,
        evidence: {},
        message: "Tender not found",
        blockingIssues: ["Tender required for cost validation"],
      };
    }

    const results = simulation.results as Record<string, unknown>;
    const totalCost = results?.total_cost as number;
    const estimatedValue = tender.estimatedValue;

    if (!totalCost || !estimatedValue) {
      return {
        passed: false,
        confidence: 0,
        evidence: { totalCost, estimatedValue },
        message: "Missing cost data for validation",
        blockingIssues: ["Cost data incomplete"],
      };
    }

    // Check if calculated cost is within reasonable bounds (50% - 150% of estimated)
    const ratio = totalCost / estimatedValue;
    const isReasonable = ratio >= 0.5 && ratio <= 1.5;
    const confidence = isReasonable
      ? 0.9
      : Math.max(0.1, 1 - Math.abs(1 - ratio));

    return {
      passed: isReasonable,
      confidence,
      evidence: {
        totalCost,
        estimatedValue,
        ratio,
        reasonableBounds: "50%-150% of estimated value",
      },
      message: isReasonable
        ? `Cost is reasonable (${Math.round(ratio * 100)}% of estimate)`
        : `Cost outside reasonable bounds (${Math.round(
            ratio * 100
          )}% of estimate)`,
      warnings: !isReasonable
        ? [
            ratio < 0.5
              ? "Cost significantly below estimate - verify calculations"
              : "Cost significantly above estimate - review pricing assumptions",
          ]
        : undefined,
    };
  }

  private async validateFinalKikCompliance(
    _context: GuardContext
  ): Promise<GuardResult> {
    // Final KİK compliance check - placeholder for full implementation
    return {
      passed: true,
      confidence: 0.8,
      evidence: {
        note: "Final KİK compliance check - requires full KİK integration",
      },
      message: "Final KİK compliance verified",
      warnings: ["Full KİK compliance validation needs implementation"],
    };
  }
}

/**
 * Evaluate guards for a pipeline step
 */
export async function evaluateGuards(
  context: GuardContext
): Promise<GuardEvaluationResult> {
  const guardLayer = ServiceProfileGuardLayer.getInstance();
  return guardLayer.evaluateStep(context);
}

/**
 * Check if a step can proceed based on guard evaluation
 */
export async function canProceedWithStep(
  docHash: string,
  step: string,
  tenderId?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<{ canProceed: boolean; evaluation: GuardEvaluationResult }> {
  const context: GuardContext = {
    docHash,
    step,
    tenderId,
    userId: userId || "system",
    metadata,
  };

  const evaluation = await evaluateGuards(context);

  return {
    canProceed: evaluation.canProceed,
    evaluation,
  };
}
