/**
 * Cost Simulation API Endpoint
 * POST /api/simulations/run - Maliyet simülasyonu çalıştırma
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma as db } from "@/lib/core/database";
import { validateRequest, createApiResponse } from "@/lib/api/validation";
import { runCostSimulation } from "@/lib/cost/simulation";
import { SimulationInput } from "@/lib/cost/types";

// Request validation schema
const SimulationRequestSchema = z.object({
  tenderId: z.string().optional(),
  docHash: z.string().optional(),

  // Simulation input data
  persons: z.number().positive().max(10000),
  meals_per_day: z.number().positive().max(5),
  duration_days: z.number().positive().max(3650), // max 10 years

  portion_specs: z
    .array(
      z.object({
        category: z.string().min(1),
        gram_per_portion: z.number().positive().max(2000),
        market_price_per_kg: z.number().positive().max(1000),
        waste_percentage: z.number().min(0).max(50).optional(),
      })
    )
    .min(1)
    .max(20),

  staffing: z
    .array(
      z.object({
        role: z.string().min(1),
        count: z.number().positive().max(100),
        hours_per_day: z.number().positive().max(24),
        hourly_wage: z.number().positive().max(500),
        shift_multiplier: z.number().positive().max(3).optional(),
        benefits_multiplier: z.number().positive().max(3).optional(),
      })
    )
    .optional(),

  service_days_per_week: z.number().min(1).max(7).optional(),
  hygiene_standards: z.array(z.string()).optional(),
  location: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

type SimulationRequest = z.infer<typeof SimulationRequestSchema>;

/**
 * POST /api/simulations/run
 * Maliyet simülasyonu çalıştırır
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Request validation
    const validationResult = await validateRequest(
      request,
      SimulationRequestSchema
    );
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          "Geçersiz istek",
          "VALIDATION_ERROR",
          validationResult.errors
        ),
        { status: 400 }
      );
    }

    const data = validationResult.data as SimulationRequest;

    // Check for existing simulation (idempotent operation)
    let existingSimulation = null;
    if (data.docHash) {
      existingSimulation = await db.costSimulation.findFirst({
        where: { docHash: data.docHash },
        orderBy: { createdAt: "desc" },
      });
    } else if (data.tenderId) {
      existingSimulation = await db.costSimulation.findFirst({
        where: { tenderId: data.tenderId },
        orderBy: { createdAt: "desc" },
      });
    }

    // Return existing simulation if found (idempotent)
    if (existingSimulation) {
      return NextResponse.json(
        createApiResponse(
          true,
          {
            simulationId: existingSimulation.id,
            cached: true,
            inputs: existingSimulation.inputs,
            outputs: existingSimulation.outputs,
            confidence: existingSimulation.confidence,
            createdAt: existingSimulation.createdAt,
          },
          "Mevcut simülasyon bulundu"
        ),
        { status: 200 }
      );
    }

    // Prepare simulation input
    const simulationInput: SimulationInput = {
      persons: data.persons,
      meals_per_day: data.meals_per_day,
      duration_days: data.duration_days,
      portion_specs: data.portion_specs,
      staffing: data.staffing,
      service_days_per_week: data.service_days_per_week,
      hygiene_standards: data.hygiene_standards,
      location: data.location,
      doc_hash: data.docHash,
      confidence: data.confidence,
    };

    // Run cost simulation
    const simulationOutput = await runCostSimulation(simulationInput);

    // PT Eşitliği Assertion - Critical validation
    if (simulationOutput && simulationOutput.project_total) {
      const materialCost = simulationOutput.material_cost?.total || 0;
      const laborCost = simulationOutput.labor_cost?.total || 0;
      const overheadCost = simulationOutput.overhead_cost?.total || 0;
      const maintenanceCost = simulationOutput.maintenance_cost?.total || 0;
      const projectTotal = simulationOutput.project_total || 0;

      const calculatedTotal =
        materialCost + laborCost + overheadCost + maintenanceCost;
      const difference = Math.abs(calculatedTotal - projectTotal);
      const tolerance = 0.01; // 1 cent tolerance for floating point precision

      if (difference > tolerance) {
        // SEV-1 Critical Error: PT Equality Violation
        const error = {
          severity: "SEV-1",
          code: "PT_MISMATCH",
          message: "Project total does not equal sum of component costs",
          details: {
            materialCost,
            laborCost,
            overheadCost,
            maintenanceCost,
            calculatedTotal,
            projectTotal,
            difference,
            tolerance,
          },
          timestamp: new Date().toISOString(),
          docHash: data.docHash,
          tenderId: data.tenderId,
        };

        console.error("SEV-1 PT_MISMATCH:", error);

        return NextResponse.json(
          createApiResponse(
            false,
            null,
            `Critical simulation error: PT equality violation (difference: ${difference.toFixed(
              2
            )} TRY)`,
            "PT_MISMATCH_ERROR"
          ),
          { status: 500 }
        );
      }
    }

    // Validate tender exists if tenderId provided
    let tender = null;
    if (data.tenderId) {
      tender = await db.tender.findUnique({
        where: { id: data.tenderId },
      });

      if (!tender) {
        return NextResponse.json(
          createApiResponse(
            false,
            null,
            "İhale bulunamadı",
            "TENDER_NOT_FOUND"
          ),
          { status: 404 }
        );
      }
    }

    // Save simulation to database
    const savedSimulation = await db.costSimulation.create({
      data: {
        tenderId: data.tenderId || null,
        inputs: JSON.parse(JSON.stringify(simulationInput)),
        outputs: JSON.parse(JSON.stringify(simulationOutput)),
        confidence: simulationOutput.confidence,
        docHash: data.docHash || null,
        version: "1.0",
      },
    });

    // Create checklist items if tender exists
    if (tender && data.tenderId) {
      const checklistItems = [
        {
          type: "CERTIFICATE",
          title: "ISO 22000 Gıda Güvenliği Sertifikası",
          description: "Gıda güvenliği yönetim sistemi sertifikasının kontrolü",
          priority: "HIGH" as const,
        },
        {
          type: "CERTIFICATE",
          title: "HACCP Sertifikası",
          description:
            "Tehlike analizi ve kritik kontrol noktaları sertifikasının kontrolü",
          priority: "HIGH" as const,
        },
      ];

      // Delete existing checklist items for this tender
      await db.checklistItem.deleteMany({
        where: { tenderId: data.tenderId },
      });

      // Create new checklist items
      await db.checklistItem.createMany({
        data: checklistItems.map((item) => ({
          tenderId: data.tenderId!,
          type: item.type,
          title: item.title,
          description: item.description,
          priority: item.priority,
          status: "PENDING" as const,
        })),
      });
    }

    // Task 8: Monitoring Metrics - Record SLI metrics for production monitoring
    try {
      // Check for idempotent deduplication
      const existingSimulation = data.docHash
        ? await db.costSimulation.findFirst({
            where: { docHash: data.docHash },
          })
        : null;

      const isIdempotentDedup = !!existingSimulation;

      // Record idempotent deduplication metric
      await db.sLIMetric.create({
        data: {
          name: "idempotent_dedup_count",
          value: isIdempotentDedup ? 1 : 0,
          timestamp: new Date(),
          labels: {
            endpoint: "simulations_run",
            has_docHash: !!data.docHash,
            has_tenderId: !!data.tenderId,
          },
          details: {
            docHash: data.docHash,
            tenderId: data.tenderId,
            deduped: isIdempotentDedup,
          },
        },
      });

      // Record ADT flag accuracy metric from KİK analysis
      const adtDetected = simulationOutput.kik_analysis.explanation_required;
      const riskLevel = simulationOutput.kik_analysis.risk_level;

      await db.sLIMetric.create({
        data: {
          name: "adt_flag_accuracy",
          value: adtDetected ? 1 : 0,
          timestamp: new Date(),
          labels: {
            risk_level: riskLevel,
            k_factor: simulationOutput.kik_analysis.k_factor,
            compliant: simulationOutput.kik_summary.compliant,
          },
          details: {
            threshold_ratio: simulationOutput.kik_summary.threshold_ratio,
            audit_version: simulationOutput.kik_summary.audit_version,
            explanation_required: adtDetected,
          },
        },
      });

      console.log("SLI Metrics recorded:", {
        idempotent_dedup: isIdempotentDedup,
        adt_flag: adtDetected,
        risk_level: riskLevel,
      });
    } catch (metricsError) {
      // Don't fail the main request if metrics recording fails
      console.warn("Failed to record SLI metrics:", metricsError);
    }

    // Return success response
    return NextResponse.json(
      createApiResponse(
        true,
        {
          simulationId: savedSimulation.id,
          cached: false,
          inputs: simulationInput,
          outputs: simulationOutput,
          confidence: simulationOutput.confidence,
          createdAt: savedSimulation.createdAt,
          checklistGenerated: !!tender,
        },
        "Maliyet simülasyonu başarıyla tamamlandı"
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error("Simulation error:", error);

    return NextResponse.json(
      createApiResponse(
        false,
        null,
        error instanceof Error
          ? error.message
          : "Simülasyon sırasında hata oluştu",
        "SIMULATION_ERROR"
      ),
      { status: 500 }
    );
  }
}

/**
 * GET /api/simulations/run?simulationId=...
 * Simülasyon sonuçlarını getir
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const simulationId = url.searchParams.get("simulationId");
    const tenderId = url.searchParams.get("tenderId");

    if (!simulationId && !tenderId) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          "simulationId veya tenderId gerekli",
          "MISSING_PARAMETER"
        ),
        { status: 400 }
      );
    }

    // Find simulation
    let simulation = null;
    if (simulationId) {
      simulation = await db.costSimulation.findUnique({
        where: { id: simulationId },
        include: {
          tender: {
            select: {
              id: true,
              title: true,
              institutionName: true,
              personCount: true,
              deadline: true,
            },
          },
        },
      });
    } else if (tenderId) {
      simulation = await db.costSimulation.findFirst({
        where: { tenderId },
        orderBy: { createdAt: "desc" },
        include: {
          tender: {
            select: {
              id: true,
              title: true,
              institutionName: true,
              personCount: true,
              deadline: true,
            },
          },
        },
      });
    }

    if (!simulation) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          "Simülasyon bulunamadı",
          "SIMULATION_NOT_FOUND"
        ),
        { status: 404 }
      );
    }

    // Get associated checklist items
    const checklistItems = simulation.tenderId
      ? await db.checklistItem.findMany({
          where: { tenderId: simulation.tenderId },
          orderBy: { createdAt: "asc" },
        })
      : [];

    return NextResponse.json(
      createApiResponse(
        true,
        {
          simulation: {
            id: simulation.id,
            inputs: simulation.inputs,
            outputs: simulation.outputs,
            confidence: simulation.confidence,
            version: simulation.version,
            createdAt: simulation.createdAt,
            updatedAt: simulation.updatedAt,
          },
          tender: simulation.tender,
          checklist: checklistItems,
        },
        "Simülasyon bulundu"
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error("Get simulation error:", error);

    return NextResponse.json(
      createApiResponse(
        false,
        null,
        "Simülasyon getirme sırasında hata oluştu",
        "GET_SIMULATION_ERROR"
      ),
      { status: 500 }
    );
  }
}
