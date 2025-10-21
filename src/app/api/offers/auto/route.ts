/**
 * Automatic Offer Generation API Endpoint
 * POST /api/offers/auto - Simülasyon sonucundan otomatik teklif oluşturma
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma as db } from "@/lib/core/database";
import { validateRequest, createApiResponse } from "@/lib/api/validation";
import { performKIKAnalysis } from "@/lib/cost/kik";
import { SimulationOutput } from "@/lib/cost/types";

// Request validation schema
const AutoOfferRequestSchema = z.object({
  simulationId: z.string().cuid(),
  clientId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  validUntil: z.string().datetime().optional(), // ISO string
  customAdjustments: z
    .object({
      materialCostMultiplier: z.number().min(0.5).max(2.0).optional(),
      laborCostMultiplier: z.number().min(0.5).max(2.0).optional(),
      profitMarginOverride: z.number().min(0).max(100).optional(), // percentage
    })
    .optional(),
});

type AutoOfferRequest = z.infer<typeof AutoOfferRequestSchema>;

/**
 * POST /api/offers/auto
 * Simülasyon sonucundan otomatik teklif oluşturur
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Request validation
    const validationResult = await validateRequest(
      request,
      AutoOfferRequestSchema
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

    const data = validationResult.data as AutoOfferRequest;

    // Find simulation
    const simulation = await db.costSimulation.findUnique({
      where: { id: data.simulationId },
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

    // Validate client exists
    const client = await db.user.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          "Müşteri bulunamadı",
          "CLIENT_NOT_FOUND"
        ),
        { status: 404 }
      );
    }

    // Parse simulation outputs
    const simulationOutput = simulation.outputs as unknown as SimulationOutput;

    // Apply custom adjustments if provided
    let adjustedOutput = { ...simulationOutput };
    if (data.customAdjustments) {
      adjustedOutput = applyCustomAdjustments(
        simulationOutput,
        data.customAdjustments
      );
    }

    // Perform KİK analysis on adjusted output
    const kikAnalysis = performKIKAnalysis(
      adjustedOutput,
      adjustedOutput.recommended_price
    );

    // Generate offer breakdown
    const breakdown = {
      material: adjustedOutput.material_cost.total,
      labor: adjustedOutput.labor_cost.total,
      overhead: adjustedOutput.overhead_cost.total,
      maintenance: adjustedOutput.maintenance_cost?.total || 0,
      profit: adjustedOutput.profit_margin,
      total: adjustedOutput.project_total + adjustedOutput.profit_margin,
    };

    // Validate breakdown consistency (kritik kontrol)
    const calculatedTotal =
      breakdown.material +
      breakdown.labor +
      breakdown.overhead +
      breakdown.maintenance +
      breakdown.profit;
    if (Math.abs(calculatedTotal - breakdown.total) > 0.01) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          `Maliyet hesaplama hatası: ${calculatedTotal} ≠ ${breakdown.total}`,
          "CALCULATION_ERROR"
        ),
        { status: 400 }
      );
    }

    // Check for existing offer (idempotent) - using metadata field for client identification
    const existingOffer = await db.offer.findFirst({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Son 24 saat içinde
        },
      },
    });

    if (existingOffer) {
      return NextResponse.json(
        createApiResponse(
          true,
          {
            offerId: existingOffer.id,
            cached: true,
            offer: existingOffer,
            kikAnalysis,
          },
          "Mevcut teklif bulundu"
        ),
        { status: 200 }
      );
    }

    // Create offer
    const newOffer = await db.offer.create({
      data: {
        tenderId: simulation.tenderId || simulation.id, // Use simulation ID as fallback
        totalAmount: breakdown.total,
        simulationId: simulation.id, // Required - link to cost simulation
        itemsData: breakdown,
        metadata: {
          title: data.title,
          description:
            data.description ||
            `${
              simulation.tender?.institutionName || "Kurum"
            } için otomatik oluşturulan teklif`,
          clientId: data.clientId,
          totalCost: breakdown.total,
          materialCost: breakdown.material,
          laborCost: breakdown.labor,
          overheadCost: breakdown.overhead,
          profitMargin: breakdown.profit / breakdown.total, // Yüzde olarak
          estimatedRevenue: breakdown.total,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          status: "DRAFT",
          priority:
            kikAnalysis.adt_status.risk_level === "HIGH" ? "HIGH" : "MEDIUM",
        },
      },
    });

    // Generate offer items for itemsData JSON (no longer separate table)
    const offerItems = generateOfferItems(adjustedOutput, newOffer.id);

    // Items are already in newOffer.itemsData, no separate table insert needed

    // Return success with comprehensive data
    return NextResponse.json(
      createApiResponse(
        true,
        {
          offerId: newOffer.id,
          cached: false,
          offer: {
            ...newOffer,
            items: offerItems, // From itemsData JSON
          },
          simulation: {
            id: simulation.id,
            confidence: simulation.confidence,
            version: simulation.version,
          },
          kikAnalysis,
          complianceStatus: {
            adtRequired: kikAnalysis.adt_status.explanation_required,
            riskLevel: kikAnalysis.adt_status.risk_level,
            complianceScore: kikAnalysis.compliance_score,
          },
        },
        "Otomatik teklif başarıyla oluşturuldu"
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error("Auto offer error:", error);

    return NextResponse.json(
      createApiResponse(
        false,
        null,
        error instanceof Error
          ? error.message
          : "Otomatik teklif oluştırma sırasında hata oluştu",
        "AUTO_OFFER_ERROR"
      ),
      { status: 500 }
    );
  }
}

/**
 * GET /api/offers/auto?simulationId=...
 * Simülasyon için otomatik teklif önizlemesi
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const simulationId = url.searchParams.get("simulationId");

    if (!simulationId) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          "simulationId gerekli",
          "MISSING_PARAMETER"
        ),
        { status: 400 }
      );
    }

    // Find simulation
    const simulation = await db.costSimulation.findUnique({
      where: { id: simulationId },
      include: {
        tender: true,
      },
    });

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

    // Parse simulation outputs
    const simulationOutput = simulation.outputs as unknown as SimulationOutput;

    // Perform KİK analysis
    const kikAnalysis = performKIKAnalysis(
      simulationOutput,
      simulationOutput.recommended_price
    );

    // Generate preview breakdown
    const previewBreakdown = {
      material: simulationOutput.material_cost.total,
      labor: simulationOutput.labor_cost.total,
      overhead: simulationOutput.overhead_cost.total,
      maintenance: simulationOutput.maintenance_cost?.total || 0,
      profit: simulationOutput.profit_margin,
      total: simulationOutput.project_total + simulationOutput.profit_margin,
    };

    // Generate preview items
    const previewItems = generateOfferItems(simulationOutput, "preview");

    return NextResponse.json(
      createApiResponse(
        true,
        {
          simulation: {
            id: simulation.id,
            confidence: simulation.confidence,
            version: simulation.version,
            createdAt: simulation.createdAt,
          },
          tender: simulation.tender,
          previewBreakdown,
          previewItems,
          kikAnalysis,
          recommendations: generateOfferRecommendations(
            simulationOutput,
            kikAnalysis
          ),
        },
        "Teklif önizlemesi hazırlandı"
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error("Auto offer preview error:", error);

    return NextResponse.json(
      createApiResponse(
        false,
        null,
        "Teklif önizlemesi sırasında hata oluştu",
        "PREVIEW_ERROR"
      ),
      { status: 500 }
    );
  }
}

/**
 * Helper Functions
 */

function applyCustomAdjustments(
  originalOutput: SimulationOutput,
  adjustments: NonNullable<AutoOfferRequest["customAdjustments"]>
): SimulationOutput {
  const adjusted = { ...originalOutput };

  // Apply material cost multiplier
  if (adjustments.materialCostMultiplier) {
    const multiplier = adjustments.materialCostMultiplier;
    adjusted.material_cost = {
      ...adjusted.material_cost,
      total: adjusted.material_cost.total * multiplier,
      daily: adjusted.material_cost.daily * multiplier,
      per_person: adjusted.material_cost.per_person * multiplier,
    };
  }

  // Apply labor cost multiplier
  if (adjustments.laborCostMultiplier) {
    const multiplier = adjustments.laborCostMultiplier;
    adjusted.labor_cost = {
      ...adjusted.labor_cost,
      total: adjusted.labor_cost.total * multiplier,
      daily: adjusted.labor_cost.daily * multiplier,
      per_person: adjusted.labor_cost.per_person * multiplier,
    };
  }

  // Recalculate project total
  adjusted.project_total =
    adjusted.material_cost.total +
    adjusted.labor_cost.total +
    adjusted.overhead_cost.total +
    (adjusted.maintenance_cost?.total || 0);

  // Apply profit margin override
  if (adjustments.profitMarginOverride !== undefined) {
    adjusted.profit_percentage = adjustments.profitMarginOverride;
    adjusted.profit_margin =
      adjusted.project_total * (adjustments.profitMarginOverride / 100);
  }

  // Recalculate recommended price
  adjusted.recommended_price = adjusted.project_total + adjusted.profit_margin;

  return adjusted;
}

function generateOfferItems(
  simulationOutput: SimulationOutput,
  offerId: string
) {
  const items = [
    {
      offerId,
      name: "Malzeme Maliyeti",
      description: "Gıda malzemeleri, ambalaj ve tüketim malzemeleri",
      quantity: 1,
      unitCost: simulationOutput.material_cost.total,
      totalCost: simulationOutput.material_cost.total,
      category: "CORE_SERVICE",
    },
    {
      offerId,
      name: "İşçilik Maliyeti",
      description: "Personel ücretleri, SGK primleri ve yan haklar",
      quantity: 1,
      unitCost: simulationOutput.labor_cost.total,
      totalCost: simulationOutput.labor_cost.total,
      category: "MATERIALS",
    },
    {
      offerId,
      name: "Genel Giderler",
      description: "Yönetim, ekipman amortismanı ve işletme giderleri",
      quantity: 1,
      unitCost: simulationOutput.overhead_cost.total,
      totalCost: simulationOutput.overhead_cost.total,
      category: "OVERHEAD",
    },
  ];

  // Add maintenance if exists
  if (
    simulationOutput.maintenance_cost &&
    simulationOutput.maintenance_cost.total > 0
  ) {
    items.push({
      offerId,
      name: "Bakım ve Operasyon",
      description: "Periyodik bakım ve operasyonel destek maliyetleri",
      quantity: 1,
      unitCost: simulationOutput.maintenance_cost.total,
      totalCost: simulationOutput.maintenance_cost.total,
      category: "MAINTENANCE",
    });
  }

  // Add profit margin
  items.push({
    offerId,
    name: "Kâr Marjı",
    description: `%${simulationOutput.profit_percentage} kâr marjı`,
    quantity: 1,
    unitCost: simulationOutput.profit_margin,
    totalCost: simulationOutput.profit_margin,
    category: "CUSTOM",
  });

  return items;
}

function generateOfferRecommendations(
  simulationOutput: SimulationOutput,
  kikAnalysis: Record<string, unknown>
) {
  const recommendations = [];

  // KİK compliance recommendations
  const adtStatus = kikAnalysis.adt_status as Record<string, unknown>;
  if (adtStatus && adtStatus.explanation_required) {
    recommendations.push({
      type: "COMPLIANCE",
      priority: "HIGH",
      title: "ADT Açıklama Gerekli",
      description:
        "Teklif fiyatı KİK threshold değerinin altında. Detaylı açıklama raporu hazırlanmalı.",
    });
  }

  // Confidence-based recommendations
  if (simulationOutput.confidence < 0.8) {
    recommendations.push({
      type: "DATA_QUALITY",
      priority: "MEDIUM",
      title: "Veri Kalitesi Uyarısı",
      description: `Simülasyon güven skoru %${Math.round(
        simulationOutput.confidence * 100
      )}. Daha detaylı girdi verisi önerilir.`,
    });
  }

  // Risk level recommendations
  if (simulationOutput.kik_analysis.risk_level === "HIGH") {
    recommendations.push({
      type: "RISK",
      priority: "HIGH",
      title: "Yüksek Risk Projesi",
      description:
        "Ek risk azaltma önlemleri ve güvence planları hazırlanmalı.",
    });
  }

  return recommendations;
}
