/**
 * Workflow Automation Engine
 * analysis_v1 persist → Tender → Checklist → Simulation → Offer pipeline
 */

import { PrismaClient } from "@prisma/client";
import { log } from "../utils/logger";
import type { SimulationInput } from "../cost/types";

const prisma = new PrismaClient();

export interface WorkflowContext {
  tenderId: string;
  userId: string;
  documentHash?: string;
  analysisData?: Record<string, unknown>;
}

export interface WorkflowStepResult {
  success: boolean;
  stepId: string;
  output?: Record<string, unknown>;
  error?: string;
  duration_ms: number;
}

export class WorkflowAutomation {
  private static instance: WorkflowAutomation;

  public static getInstance(): WorkflowAutomation {
    if (!WorkflowAutomation.instance) {
      WorkflowAutomation.instance = new WorkflowAutomation();
    }
    return WorkflowAutomation.instance;
  }

  /**
   * Main automation pipeline trigger
   * Called after analysis_v1 persists to database
   */
  async triggerPipeline(
    context: WorkflowContext
  ): Promise<WorkflowStepResult[]> {
    const startTime = Date.now();
    const results: WorkflowStepResult[] = [];

    try {
      log.info(
        `🚀 Starting automation pipeline for tender ${context.tenderId}`,
        {
          userId: context.userId,
          documentHash: context.documentHash,
        }
      );

      // Step 1: Validate Tender exists and is ready
      const tenderStep = await this.validateTender(context);
      results.push(tenderStep);
      if (!tenderStep.success) return results;

      // Step 2: Generate Checklist items
      const checklistStep = await this.generateChecklist(context);
      results.push(checklistStep);
      if (!checklistStep.success) return results;

      // Step 3: Run Cost Simulation
      const simulationStep = await this.runSimulation(context);
      results.push(simulationStep);
      if (!simulationStep.success) return results;

      // Step 4: Auto-generate Offer
      const offerStep = await this.generateOffer(
        context,
        simulationStep.output
      );
      results.push(offerStep);

      const totalDuration = Date.now() - startTime;
      log.info(`✅ Pipeline completed for tender ${context.tenderId}`, {
        totalDuration_ms: totalDuration,
        steps: results.length,
        success: results.every((r) => r.success),
      });

      return results;
    } catch (error) {
      const errorResult: WorkflowStepResult = {
        success: false,
        stepId: "pipeline_error",
        error: error instanceof Error ? error.message : "Unknown error",
        duration_ms: Date.now() - startTime,
      };
      results.push(errorResult);
      return results;
    }
  }

  private async validateTender(
    context: WorkflowContext
  ): Promise<WorkflowStepResult> {
    const startTime = Date.now();

    try {
      const tender = await prisma.tender.findUnique({
        where: { id: context.tenderId },
        include: {
          analysis: true,
        },
      });

      if (!tender) {
        return {
          success: false,
          stepId: "validate_tender",
          error: "Tender not found",
          duration_ms: Date.now() - startTime,
        };
      }

      if (!tender.analysis) {
        return {
          success: false,
          stepId: "validate_tender",
          error: "Tender analysis not found",
          duration_ms: Date.now() - startTime,
        };
      }

      return {
        success: true,
        stepId: "validate_tender",
        output: { tender: { id: tender.id, title: tender.title } },
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        stepId: "validate_tender",
        error: error instanceof Error ? error.message : "Validation failed",
        duration_ms: Date.now() - startTime,
      };
    }
  }

  private async generateChecklist(
    context: WorkflowContext
  ): Promise<WorkflowStepResult> {
    const startTime = Date.now();

    try {
      // Get tender analysis to determine checklist items
      const tender = await prisma.tender.findUnique({
        where: { id: context.tenderId },
        include: { analysis: true },
      });

      if (!tender?.analysis) {
        throw new Error("Tender analysis required for checklist generation");
      }

      const analysisData = tender.analysis.analysis_v1 as Record<
        string,
        unknown
      >;
      const checklistItems = this.generateChecklistItems(
        context.tenderId,
        analysisData
      );

      // Batch create checklist items
      await prisma.checklistItem.createMany({
        data: checklistItems,
        skipDuplicates: true,
      });

      return {
        success: true,
        stepId: "generate_checklist",
        output: {
          itemsCreated: checklistItems.length,
          items: checklistItems.map((item) => ({
            type: item.type,
            title: item.title,
          })),
        },
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        stepId: "generate_checklist",
        error:
          error instanceof Error
            ? error.message
            : "Checklist generation failed",
        duration_ms: Date.now() - startTime,
      };
    }
  }

  private async runSimulation(
    context: WorkflowContext
  ): Promise<WorkflowStepResult> {
    const startTime = Date.now();

    try {
      // Get tender analysis for simulation input
      const tender = await prisma.tender.findUnique({
        where: { id: context.tenderId },
        include: { analysis: true },
      });

      if (!tender?.analysis) {
        throw new Error("Tender analysis required for simulation");
      }

      const analysisData = tender.analysis.analysis_v1 as Record<
        string,
        unknown
      >;
      const simulationInput = this.createSimulationInput(analysisData);

      // Call simulation engine directly
      const { CostSimulationEngine } = await import("../cost/simulation");
      const { KIKCalculator } = await import("../cost/kik");

      const engine = new CostSimulationEngine();

      const simulationOutput = await engine.simulate(simulationInput);
      const kikThreshold = KIKCalculator.calculateThreshold(simulationOutput);
      const kikAnalysis = KIKCalculator.checkADTStatus(
        simulationOutput.recommended_price,
        kikThreshold.threshold_value_try
      );

      // Save to database
      const costSimulation = await prisma.costSimulation.create({
        data: {
          tenderId: context.tenderId,
          inputs: simulationInput,
          outputs: {
            ...simulationOutput,
            kikAnalysis,
            kikThreshold,
          },
          version: "1.0",
        },
      });

      const simulationResult = {
        simulationId: costSimulation.id,
        output: {
          totalCost: simulationOutput.recommended_price,
          kikAnalysis,
        },
      };

      return {
        success: true,
        stepId: "run_simulation",
        output: {
          simulationId: simulationResult.simulationId,
          estimatedCost: simulationResult.output?.totalCost,
          kikStatus: simulationResult.output?.kikAnalysis?.risk_level,
        },
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        stepId: "run_simulation",
        error: error instanceof Error ? error.message : "Simulation failed",
        duration_ms: Date.now() - startTime,
      };
    }
  }

  private async generateOffer(
    context: WorkflowContext,
    simulationOutput?: Record<string, unknown>
  ): Promise<WorkflowStepResult> {
    const startTime = Date.now();

    try {
      if (!simulationOutput?.simulationId) {
        throw new Error("Simulation ID required for offer generation");
      }

      // Create offer directly
      const simulationId = simulationOutput.simulationId as string;

      // Get simulation from database
      const costSimulation = await prisma.costSimulation.findUnique({
        where: { id: simulationId },
      });

      if (!costSimulation) {
        throw new Error("Simulation not found");
      }

      const outputs = costSimulation.outputs as Record<string, unknown>;

      // Create offer
      const offer = await prisma.offer.create({
        data: {
          title: `Otomatik Teklif - ${context.tenderId}`,
          description: "Otomasyon sistemi tarafından oluşturulan teklif",
          totalAmount: (outputs.recommended_price as number) || 0,
          status: "DRAFT",
          breakdown: {
            material: outputs.material_cost || {},
            labor: outputs.labor_cost || {},
            overhead: outputs.overhead_cost || {},
            maintenance: outputs.maintenance_cost || {},
            profit: (outputs.profit_margin as number) || 0,
            total: (outputs.recommended_price as number) || 0,
          },
        },
      });

      const offerResult = {
        offerId: offer.id,
        totalAmount: offer.totalAmount,
        status: offer.status,
        items: [], // Will be populated by separate process
      };

      return {
        success: true,
        stepId: "generate_offer",
        output: {
          offerId: offerResult.offerId,
          itemCount: offerResult.items?.length || 0,
          totalAmount: offerResult.totalAmount,
          status: offerResult.status,
        },
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        stepId: "generate_offer",
        error:
          error instanceof Error ? error.message : "Offer generation failed",
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate checklist items based on analysis data
   */
  private generateChecklistItems(
    tenderId: string,
    analysisData: Record<string, unknown>
  ): Array<{
    tenderId: string;
    type: string;
    title: string;
    status: "pending" | "completed" | "failed";
  }> {
    const items = [];

    // Document validation items
    items.push({
      tenderId,
      type: "document_validation",
      title: "İhale dokümanı analiz edildi",
      status: "completed" as const,
    });

    // KİK compliance items
    items.push({
      tenderId,
      type: "kik_compliance",
      title: "KİK uyumluluk kontrolü",
      status: "pending" as const,
    });

    // Cost calculation items
    items.push({
      tenderId,
      type: "cost_calculation",
      title: "Maliyet hesaplaması",
      status: "pending" as const,
    });

    // Market price verification
    items.push({
      tenderId,
      type: "market_prices",
      title: "Piyasa fiyatları güncellemesi",
      status: "pending" as const,
    });

    // Risk assessment
    if (analysisData.hasHighRisk) {
      items.push({
        tenderId,
        type: "risk_assessment",
        title: "Yüksek risk analizi",
        status: "pending" as const,
      });
    }

    // Technical specs verification
    if (analysisData.hasTechnicalSpecs) {
      items.push({
        tenderId,
        type: "technical_specs",
        title: "Teknik şartname kontrolü",
        status: "pending" as const,
      });
    }

    return items;
  }

  /**
   * Create simulation input from analysis data
   */
  private createSimulationInput(
    analysisData: Record<string, unknown>
  ): SimulationInput {
    // Extract data from analysis
    const personCount = this.extractPersonCount(analysisData);
    const serviceType = this.extractServiceType(analysisData);
    const duration = this.extractDuration(analysisData);

    return {
      persons: personCount,
      meals_per_day: serviceType === "PMYO" ? 3 : 2,
      duration_days: duration,
      portion_specs: [
        {
          category: "Ana Yemek",
          gram_per_portion: 200,
          market_price_per_kg:
            (this.calculateBaseIngredientCost(personCount, serviceType) /
              personCount) *
            5,
          waste_percentage: 6,
        },
      ],
      staffing: [
        {
          role: "Aşçı",
          count: Math.ceil(personCount / 100),
          hours_per_day: 8,
          hourly_wage: 100,
          shift_multiplier: 1.0,
          benefits_multiplier: 1.4,
        },
      ],
      service_days_per_week: 7,
      hygiene_standards: ["HACCP", "ISO 22000"],
      location: "Genel",
    };
  }

  private extractPersonCount(data: Record<string, unknown>): number {
    // Look for person count in various formats
    if (typeof data.personCount === "number") return data.personCount;
    if (typeof data.kisiSayisi === "number") return data.kisiSayisi;
    if (typeof data.capacity === "number") return data.capacity;

    // Default fallback
    return 500;
  }

  private extractServiceType(data: Record<string, unknown>): string {
    if (typeof data.serviceType === "string") return data.serviceType;
    if (typeof data.type === "string") return data.type;

    // Heuristic detection
    const text = JSON.stringify(data).toLowerCase();
    if (text.includes("pmyo") || text.includes("polis")) return "PMYO";
    if (text.includes("belediye") || text.includes("municipality"))
      return "MUNICIPALITY";

    return "GENERAL";
  }

  private extractDuration(data: Record<string, unknown>): number {
    if (typeof data.duration === "number") return data.duration;
    if (typeof data.days === "number") return data.days;
    if (typeof data.serviceDays === "number") return data.serviceDays;

    // Default to 1 year
    return 365;
  }

  private calculateBaseIngredientCost(
    personCount: number,
    serviceType: string
  ): number {
    // Base cost per person per day (in TRY)
    const baseCostPerPersonPerDay = serviceType === "PMYO" ? 25 : 20;
    return personCount * baseCostPerPersonPerDay;
  }

  private getSeasonalMultiplier(): number {
    const month = new Date().getMonth();
    // Winter months have higher costs
    if (month >= 11 || month <= 2) return 1.15;
    // Summer months have moderate costs
    if (month >= 5 && month <= 8) return 1.05;
    // Spring/Fall have baseline costs
    return 1.0;
  }
}

/**
 * Hook for triggering automation after analysis persist
 * Should be called from the analysis endpoint
 */
export async function triggerAutomationPipeline(
  tenderId: string,
  userId: string,
  documentHash?: string,
  analysisData?: Record<string, unknown>
): Promise<WorkflowStepResult[]> {
  const automation = WorkflowAutomation.getInstance();

  return automation.triggerPipeline({
    tenderId,
    userId,
    documentHash,
    analysisData,
  });
}
