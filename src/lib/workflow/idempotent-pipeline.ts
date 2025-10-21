/**
 * Idempotent Pipeline Job Manager
 * Exactly-once semantics for automation workflow
 */

import { PrismaClient } from "@prisma/client";
import { log } from "../utils/logger";
import { triggerAutomationPipeline } from "./automation";
import { evaluateGuards, GuardContext } from "./guard-layer";
import {
  recordPipelineStepSLI,
  recordGuardSLI,
  recordCostAccuracySLI,
  sliMonitor,
} from "../monitoring/sli-monitor";

const prisma = new PrismaClient();

// Type definitions for Pipeline Job
interface PipelineJobData {
  id: string;
  docHash: string;
  pipelineId: string;
  step: string;
  status:
    | "PENDING"
    | "RUNNING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "WAITING_INPUT";
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  errorCode?: string;
  errorMessage?: string;
  metadata: Record<string, unknown>;
  evidence: Record<string, unknown>;
  tenderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobContext {
  docHash: string;
  pipelineId?: string;
  tenderId?: string;
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface JobResult {
  success: boolean;
  jobId: string;
  step: string;
  status: "COMPLETED" | "FAILED" | "CANCELLED" | "WAITING_INPUT";
  output?: Record<string, unknown>;
  error?: string;
  duration_ms: number;
}

export class IdempotentPipelineManager {
  private static instance: IdempotentPipelineManager;

  public static getInstance(): IdempotentPipelineManager {
    if (!IdempotentPipelineManager.instance) {
      IdempotentPipelineManager.instance = new IdempotentPipelineManager();
    }
    return IdempotentPipelineManager.instance;
  }

  /**
   * Execute pipeline step with exactly-once semantics
   */
  async executeStep(
    context: JobContext,
    step:
      | "ANALYZE_COMPLETED"
      | "TENDER_UPSERTED"
      | "CHECKLIST_DONE"
      | "SIMULATION_DONE"
      | "OFFER_DRAFTED"
  ): Promise<JobResult> {
    const startTime = Date.now();
    const pipelineId =
      context.pipelineId || `pipeline_${context.docHash}_${Date.now()}`;

    try {
      // 0. Evaluate guard conditions before proceeding
      const guardContext: GuardContext = {
        docHash: context.docHash,
        step: step,
        tenderId: context.tenderId,
        userId: context.userId,
        metadata: context.metadata,
      };

      const guardEvaluation = await evaluateGuards(guardContext);

      if (!guardEvaluation.canProceed) {
        log.warn("Pipeline step blocked by guard conditions", {
          pipelineId,
          step,
          docHash: context.docHash,
          blockersCount: guardEvaluation.blockers.length,
          blockers: guardEvaluation.blockers.map((b) => b.message),
        });

        return {
          success: false,
          jobId: "blocked",
          step,
          status: "WAITING_INPUT",
          error: `Blocked by guard conditions: ${guardEvaluation.blockers
            .map((b) => b.message)
            .join(", ")}`,
          duration_ms: Date.now() - startTime,
        };
      }

      log.info("Guard conditions passed", {
        pipelineId,
        step,
        overallConfidence: guardEvaluation.overallConfidence,
        passedCount: guardEvaluation.passed.length,
        warningsCount: guardEvaluation.warnings.length,
      });

      // Record guard evaluation SLI
      await recordGuardSLI(
        step,
        guardEvaluation.canProceed,
        guardEvaluation.overallConfidence,
        context.docHash,
        guardEvaluation.blockers.length
      );

      // 1. Check for existing job (idempotency)
      const existingJob = await prisma.pipelineJob.findUnique({
        where: {
          pipeline_idempotency: {
            docHash: context.docHash,
            step: step,
          },
        },
      });

      if (existingJob) {
        if (existingJob.status === "COMPLETED") {
          log.info("Pipeline step already completed (idempotent)", {
            pipelineId,
            jobId: existingJob.id,
            docHash: context.docHash,
            step,
            completedAt: existingJob.completedAt,
          });

          return {
            success: true,
            jobId: existingJob.id,
            step,
            status: "COMPLETED",
            output: existingJob.metadata as Record<string, unknown>,
            duration_ms: Date.now() - startTime,
          };
        }

        if (existingJob.status === "RUNNING") {
          log.warn("Pipeline step already running (race condition)", {
            pipelineId,
            jobId: existingJob.id,
            docHash: context.docHash,
            step,
            startedAt: existingJob.startedAt,
          });

          return {
            success: false,
            jobId: existingJob.id,
            step,
            status: "CANCELLED",
            error: "Job already running",
            duration_ms: Date.now() - startTime,
          };
        }

        if (
          existingJob.status === "FAILED" &&
          existingJob.retryCount >= existingJob.maxRetries
        ) {
          log.error("Pipeline step failed and exhausted retries", {
            pipelineId,
            jobId: existingJob.id,
            docHash: context.docHash,
            step,
            errorCode: existingJob.errorCode,
            retryCount: existingJob.retryCount,
          });

          return {
            success: false,
            jobId: existingJob.id,
            step,
            status: "FAILED",
            error: existingJob.errorMessage || "Max retries exceeded",
            duration_ms: Date.now() - startTime,
          };
        }
      }

      // 2. Create or update job record
      const job = await this.upsertJob(context, step, pipelineId, existingJob);

      // 3. Execute the actual step
      const stepResult = await this.executeStepLogic(step, context, job.id);

      // 4. Update job with result
      await this.completeJob(job.id, stepResult);

      const duration = Date.now() - startTime;

      log.info("Pipeline step completed successfully", {
        pipelineId,
        jobId: job.id,
        docHash: context.docHash,
        step,
        duration_ms: duration,
      });

      // Record pipeline step SLI
      await recordPipelineStepSLI(step, true, duration, context.docHash, {
        job_id: job.id,
        pipeline_id: pipelineId,
      });

      // Record idempotency compliance
      await sliMonitor.recordIdempotencyCheck(
        context.docHash,
        step,
        true, // Successfully handled (either created new or found existing)
        existingJob ? "found_existing" : "created"
      );

      return {
        success: true,
        jobId: job.id,
        step,
        status: "COMPLETED",
        output: stepResult.output,
        duration_ms: duration,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const duration = Date.now() - startTime;

      log.error("Pipeline step failed", {
        pipelineId,
        docHash: context.docHash,
        step,
        error: errorMessage,
        duration_ms: duration,
      });

      // Record failed pipeline step SLI
      await recordPipelineStepSLI(step, false, duration, context.docHash, {
        error: errorMessage,
        pipeline_id: pipelineId,
      });

      return {
        success: false,
        jobId: "unknown",
        step,
        status: "FAILED",
        error: errorMessage,
        duration_ms: duration,
      };
    }
  }

  /**
   * Create or update pipeline job
   */
  private async upsertJob(
    context: JobContext,
    step: string,
    pipelineId: string,
    existingJob?: PipelineJobData | null
  ) {
    if (existingJob) {
      // Update existing job for retry
      return await prisma.pipelineJob.update({
        where: { id: existingJob.id },
        data: {
          status: "RUNNING",
          startedAt: new Date(),
          retryCount: existingJob.retryCount + 1,
          errorCode: null,
          errorMessage: null,
          metadata: context.metadata || {},
        },
      });
    } else {
      // Create new job
      return await prisma.pipelineJob.create({
        data: {
          docHash: context.docHash,
          pipelineId,
          step: step,
          status: "RUNNING",
          startedAt: new Date(),
          tenderId: context.tenderId,
          metadata: context.metadata || {},
          evidence: {
            created_by: context.userId,
            correlation_id: pipelineId,
            step_sequence: step,
          },
        },
      });
    }
  }

  /**
   * Execute specific step logic
   */
  private async executeStepLogic(
    step: string,
    context: JobContext,
    jobId: string
  ): Promise<{
    success: boolean;
    output?: Record<string, unknown>;
    error?: string;
  }> {
    switch (step) {
      case "ANALYZE_COMPLETED":
        return this.executeAnalysisStep(context, jobId);

      case "TENDER_UPSERTED":
        return this.executeTenderStep(context, jobId);

      case "CHECKLIST_DONE":
        return this.executeChecklistStep(context, jobId);

      case "SIMULATION_DONE":
        return this.executeSimulationStep(context, jobId);

      case "OFFER_DRAFTED":
        return this.executeOfferStep(context, jobId);

      default:
        throw new Error(`Unknown pipeline step: ${step}`);
    }
  }

  /**
   * Complete job with result
   */
  private async completeJob(
    jobId: string,
    result: {
      success: boolean;
      output?: Record<string, unknown>;
      error?: string;
    }
  ) {
    await prisma.pipelineJob.update({
      where: { id: jobId },
      data: {
        status: result.success ? "COMPLETED" : "FAILED",
        completedAt: result.success ? new Date() : null,
        errorMessage: result.error,
        metadata: result.output || {},
      },
    });
  }

  // Step implementations
  private async executeAnalysisStep(context: JobContext, jobId: string) {
    // Analysis is already completed when this is called
    return {
      success: true,
      output: {
        docHash: context.docHash,
        analysis_completed_at: new Date().toISOString(),
        job_id: jobId,
      },
    };
  }

  private async executeTenderStep(context: JobContext, jobId: string) {
    // Check if tender already exists for this docHash
    const existingTender = await prisma.tender.findFirst({
      where: { docHash: context.docHash },
    });

    if (existingTender) {
      return {
        success: true,
        output: {
          tenderId: existingTender.id,
          action: "found_existing",
          job_id: jobId,
        },
      };
    }

    // Create new tender would go here
    // For now, return the passed tenderId
    return {
      success: true,
      output: {
        tenderId: context.tenderId,
        action: "created_new",
        job_id: jobId,
      },
    };
  }

  private async executeChecklistStep(context: JobContext, jobId: string) {
    if (!context.tenderId) {
      throw new Error("Tender ID required for checklist generation");
    }

    // Generate checklist items
    const checklistItems = [
      {
        tenderId: context.tenderId,
        type: "document_validation",
        title: "İhale dokümanı analiz edildi",
        status: "COMPLETED" as const,
      },
      {
        tenderId: context.tenderId,
        type: "kik_compliance",
        title: "KİK uyumluluk kontrolü",
        status: "PENDING" as const,
      },
      {
        tenderId: context.tenderId,
        type: "cost_calculation",
        title: "Maliyet hesaplaması",
        status: "PENDING" as const,
      },
    ];

    await prisma.checklistItem.createMany({
      data: checklistItems,
      skipDuplicates: true,
    });

    return {
      success: true,
      output: {
        checklist_items_created: checklistItems.length,
        tender_id: context.tenderId,
        job_id: jobId,
      },
    };
  }

  private async executeSimulationStep(context: JobContext, jobId: string) {
    if (!context.tenderId) {
      throw new Error("Tender ID required for simulation");
    }

    // Check prerequisites
    const prerequisitesCheck = await this.validateSimulationPrerequisites(
      context.tenderId
    );
    if (!prerequisitesCheck.valid) {
      // Mark job as WAITING_INPUT
      await prisma.pipelineJob.update({
        where: { id: jobId },
        data: {
          status: "WAITING_INPUT",
          errorMessage: `Prerequisites missing: ${prerequisitesCheck.missing.join(
            ", "
          )}`,
        },
      });

      return {
        success: false,
        error: `Prerequisites missing: ${prerequisitesCheck.missing.join(
          ", "
        )}`,
      };
    }

    // Execute simulation through automation
    const automationResults = await triggerAutomationPipeline(
      context.tenderId,
      context.userId,
      context.docHash,
      context.metadata
    );

    const simulationResult = automationResults.find(
      (r) => r.stepId === "run_simulation"
    );
    if (!simulationResult?.success) {
      throw new Error(`Simulation failed: ${simulationResult?.error}`);
    }

    // PT Equality Assertion: Check simulation cost against tender estimate
    const simulation = await prisma.costSimulation.findFirst({
      where: { id: simulationResult.output?.simulationId },
    });

    const tender = await prisma.tender.findUnique({
      where: { id: context.tenderId },
    });

    if (simulation && tender && simulation.results && tender.estimatedValue) {
      const results = simulation.results as Record<string, unknown>;
      const totalCost = results?.total_cost as number;

      if (totalCost && tender.estimatedValue) {
        const ratio = totalCost / tender.estimatedValue;
        const isReasonable = ratio >= 0.5 && ratio <= 1.5;

        // Record cost accuracy SLI
        await recordCostAccuracySLI(
          context.tenderId,
          ratio,
          isReasonable,
          context.docHash
        );

        // PT Equality: Record if cost calculation is within expected bounds
        await sliMonitor.recordPTEqualityAssertion(
          context.docHash,
          "SIMULATION_DONE",
          "SIMULATION_DONE",
          isReasonable // Cost within bounds = sequence valid
        );
      }
    }

    return {
      success: true,
      output: {
        simulation_id: simulationResult.output?.simulationId,
        estimated_cost: simulationResult.output?.estimatedCost,
        kik_status: simulationResult.output?.kikStatus,
        job_id: jobId,
      },
    };
  }

  private async executeOfferStep(context: JobContext, jobId: string) {
    if (!context.tenderId) {
      throw new Error("Tender ID required for offer generation");
    }

    // Find latest simulation for this tender
    const simulation = await prisma.costSimulation.findFirst({
      where: { tenderId: context.tenderId },
      orderBy: { createdAt: "desc" },
    });

    if (!simulation) {
      throw new Error("No simulation found for tender");
    }

    // Execute offer generation through automation
    const automationResults = await triggerAutomationPipeline(
      context.tenderId,
      context.userId,
      context.docHash,
      context.metadata
    );

    const offerResult = automationResults.find(
      (r) => r.stepId === "generate_offer"
    );
    if (!offerResult?.success) {
      throw new Error(`Offer generation failed: ${offerResult?.error}`);
    }

    return {
      success: true,
      output: {
        offer_id: offerResult.output?.offerId,
        total_amount: offerResult.output?.totalAmount,
        item_count: offerResult.output?.itemCount,
        job_id: jobId,
      },
    };
  }

  /**
   * Validate simulation prerequisites
   */
  private async validateSimulationPrerequisites(tenderId: string): Promise<{
    valid: boolean;
    missing: string[];
  }> {
    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
    });

    if (!tender) {
      return { valid: false, missing: ["tender_not_found"] };
    }

    const missing: string[] = [];

    // Check required fields
    if (!tender.personCount || tender.personCount <= 0) {
      missing.push("persons");
    }

    if (!tender.estimatedValue || tender.estimatedValue <= 0) {
      missing.push("estimated_value");
    }

    // Check if we have basic service profile
    const requirements = tender.requirements as Record<string, unknown>;
    const specifications = requirements?.specifications as Record<
      string,
      unknown
    >;

    if (
      !specifications?.mealTypes ||
      !(specifications.mealTypes as unknown[])?.length
    ) {
      missing.push("meal_types");
    }

    if (!specifications?.serviceDays) {
      missing.push("service_duration");
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

/**
 * Main pipeline execution function
 */
export async function executePipelineStep(
  docHash: string,
  step:
    | "ANALYZE_COMPLETED"
    | "TENDER_UPSERTED"
    | "CHECKLIST_DONE"
    | "SIMULATION_DONE"
    | "OFFER_DRAFTED",
  context: Omit<JobContext, "docHash">
): Promise<JobResult> {
  const manager = IdempotentPipelineManager.getInstance();

  return manager.executeStep({ ...context, docHash }, step);
}

/**
 * Execute full pipeline from analysis to offer
 */
export async function executeFullPipeline(
  docHash: string,
  tenderId: string,
  userId: string,
  analysisData?: Record<string, unknown>
): Promise<JobResult[]> {
  const context = {
    tenderId,
    userId,
    metadata: analysisData,
  };

  const results: JobResult[] = [];

  const steps: Array<
    | "ANALYZE_COMPLETED"
    | "TENDER_UPSERTED"
    | "CHECKLIST_DONE"
    | "SIMULATION_DONE"
    | "OFFER_DRAFTED"
  > = [
    "ANALYZE_COMPLETED",
    "TENDER_UPSERTED",
    "CHECKLIST_DONE",
    "SIMULATION_DONE",
    "OFFER_DRAFTED",
  ];

  for (const step of steps) {
    const result = await executePipelineStep(docHash, step, context);
    results.push(result);

    if (!result.success) {
      log.error("Pipeline step failed, stopping execution", {
        docHash,
        step,
        error: result.error,
      });
      break;
    }
  }

  return results;
}
