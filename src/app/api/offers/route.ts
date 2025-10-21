import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma as db } from "@/lib/core/database";
import { validateRequest, createApiResponse } from "@/lib/api/validation";

// Request schemas
const CreateOfferRequestSchema = z
  .object({
    title: z.string().min(5).max(200),
    description: z.string().optional(),
    // Backward compatibility: Accept clientId but map to metadata
    clientId: z.string().optional(),
    // DB constraint: Offer requires a valid Tender foreign key
    tenderId: z.string().min(10, "Geçerli bir tenderId gerekli"),
    restaurantId: z.string().optional(),
    menuAnalysisId: z.string().optional(),
    serviceType: z.enum([
      "MENU_ANALYSIS",
      "PRICING_OPTIMIZATION",
      "FULL_CONSULTATION",
      "TRAINING",
      "CUSTOM",
    ]),
    requirements: z.object({
      scope: z.enum([
        "SINGLE_MENU",
        "FULL_RESTAURANT",
        "CHAIN_STANDARDIZATION",
      ]),
      urgency: z.enum(["STANDARD", "URGENT", "CRITICAL"]),
      complexity: z.enum(["BASIC", "ADVANCED", "ENTERPRISE"]),
      includeMaintenance: z.boolean().default(false),
      maintenanceMonths: z.number().min(1).max(12).optional(),
    }),
    metadata: z
      .object({
        docHash: z.string().optional(),
        clientId: z.string().optional(),
        source: z.enum(["analysis_v1", "manual"]).optional(),
        tags: z.array(z.string()).optional(),
      })
      .optional(),
    customItems: z
      .array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          quantity: z.number().min(1),
          estimatedHours: z.number().min(0.5),
        })
      )
      .optional(),
  })
  .transform((data) => {
    // Transform: Map legacy clientId to metadata.clientId
    const metadata = data.metadata || {};
    if (data.clientId && !metadata.clientId) {
      metadata.clientId = data.clientId;
    }

    return {
      ...data,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  });

type CreateOfferRequest = z.infer<typeof CreateOfferRequestSchema>;

// Business Logic Classes
class OfferPricingEngine {
  private readonly basePricing = {
    // Service base costs (per hour)
    MENU_ANALYSIS: 150,
    PRICING_OPTIMIZATION: 200,
    FULL_CONSULTATION: 300,
    TRAINING: 100,
    CUSTOM: 250,
  };

  private readonly scopeMultipliers = {
    SINGLE_MENU: 1.0,
    FULL_RESTAURANT: 2.5,
    CHAIN_STANDARDIZATION: 5.0,
  };

  private readonly complexityMultipliers = {
    BASIC: 0.8,
    ADVANCED: 1.2,
    ENTERPRISE: 1.8,
  };

  private readonly urgencyMultipliers = {
    STANDARD: 1.0,
    URGENT: 1.4,
    CRITICAL: 2.0,
  };

  calculateOfferPricing(request: CreateOfferRequest): OfferPricingResult {
    const baseRate = this.basePricing[request.serviceType];
    const complexityMultiplier =
      this.complexityMultipliers[request.requirements.complexity];
    const urgencyMultiplier =
      this.urgencyMultipliers[request.requirements.urgency];

    // Base hours calculation
    let estimatedHours = this.getBaseHours(
      request.serviceType,
      request.requirements.scope
    );

    // Complexity adjustment
    estimatedHours *= complexityMultiplier;

    // Custom items
    if (request.customItems) {
      const customHours = request.customItems.reduce(
        (sum, item) => sum + item.quantity * item.estimatedHours,
        0
      );
      estimatedHours += customHours;
    }

    // Calculate costs
    const laborCost = estimatedHours * baseRate * urgencyMultiplier;
    const materialCost = laborCost * 0.1; // %10 material overhead
    const overheadCost = laborCost * 0.15; // %15 operational overhead
    const totalCost = laborCost + materialCost + overheadCost;

    // Profit margins based on service type
    const profitMarginPercent = this.getProfitMargin(
      request.serviceType,
      request.requirements.urgency
    );
    const profitAmount = totalCost * profitMarginPercent;
    const estimatedRevenue = totalCost + profitAmount;

    // Maintenance pricing
    let maintenanceCost = 0;
    if (
      request.requirements.includeMaintenance &&
      request.requirements.maintenanceMonths
    ) {
      const monthlyMaintenanceRate = baseRate * 0.3; // %30 of base rate per month
      maintenanceCost =
        monthlyMaintenanceRate * request.requirements.maintenanceMonths * 8; // 8 hours per month
    }

    return {
      estimatedHours,
      laborCost,
      materialCost,
      overheadCost,
      totalCost,
      profitMarginPercent,
      profitAmount,
      estimatedRevenue,
      maintenanceCost,
      finalPrice: estimatedRevenue + maintenanceCost,
    };
  }

  private getBaseHours(serviceType: string, scope: string): number {
    const baseHours = {
      MENU_ANALYSIS: {
        SINGLE_MENU: 8,
        FULL_RESTAURANT: 20,
        CHAIN_STANDARDIZATION: 40,
      },
      PRICING_OPTIMIZATION: {
        SINGLE_MENU: 12,
        FULL_RESTAURANT: 30,
        CHAIN_STANDARDIZATION: 60,
      },
      FULL_CONSULTATION: {
        SINGLE_MENU: 25,
        FULL_RESTAURANT: 60,
        CHAIN_STANDARDIZATION: 120,
      },
      TRAINING: {
        SINGLE_MENU: 6,
        FULL_RESTAURANT: 16,
        CHAIN_STANDARDIZATION: 32,
      },
      CUSTOM: {
        SINGLE_MENU: 10,
        FULL_RESTAURANT: 25,
        CHAIN_STANDARDIZATION: 50,
      },
    };

    return (
      (baseHours as Record<string, Record<string, number>>)[serviceType]?.[
        scope
      ] || 10
    );
  }

  private getProfitMargin(serviceType: string, urgency: string): number {
    const baseMargins = {
      MENU_ANALYSIS: 0.25,
      PRICING_OPTIMIZATION: 0.3,
      FULL_CONSULTATION: 0.35,
      TRAINING: 0.2,
      CUSTOM: 0.28,
    };

    const urgencyBonus =
      urgency === "CRITICAL" ? 0.1 : urgency === "URGENT" ? 0.05 : 0;
    return (
      ((baseMargins as Record<string, number>)[serviceType] || 0.25) +
      urgencyBonus
    );
  }
}

interface OfferPricingResult {
  estimatedHours: number;
  laborCost: number;
  materialCost: number;
  overheadCost: number;
  totalCost: number;
  profitMarginPercent: number;
  profitAmount: number;
  estimatedRevenue: number;
  maintenanceCost: number;
  finalPrice: number;
}

class OfferItemGenerator {
  generateOfferItems(
    request: CreateOfferRequest,
    pricing: OfferPricingResult
  ): OfferItemData[] {
    const items: OfferItemData[] = [];

    // Main service item
    items.push({
      name: this.getServiceName(request.serviceType),
      description: this.getServiceDescription(
        request.serviceType,
        request.requirements
      ),
      quantity: 1,
      unitCost: pricing.laborCost,
      totalCost: pricing.laborCost,
      category: "CORE_SERVICE",
    });

    // Material costs
    if (pricing.materialCost > 0) {
      items.push({
        name: "Materyal ve Kaynak Maliyetleri",
        description: "Analiz araçları, raporlama, dokümantasyon",
        quantity: 1,
        unitCost: pricing.materialCost,
        totalCost: pricing.materialCost,
        category: "MATERIALS",
      });
    }

    // Overhead costs
    if (pricing.overheadCost > 0) {
      items.push({
        name: "Operasyonel Giderler",
        description: "Proje yönetimi, kalite kontrol, iletişim",
        quantity: 1,
        unitCost: pricing.overheadCost,
        totalCost: pricing.overheadCost,
        category: "OVERHEAD",
      });
    }

    // Custom items
    if (request.customItems) {
      for (const customItem of request.customItems) {
        const unitCost =
          customItem.estimatedHours * this.basePricing[request.serviceType];
        items.push({
          name: customItem.name,
          description: customItem.description,
          quantity: customItem.quantity,
          unitCost,
          totalCost: unitCost * customItem.quantity,
          category: "CUSTOM",
        });
      }
    }

    // Maintenance if included
    if (
      request.requirements.includeMaintenance &&
      pricing.maintenanceCost > 0
    ) {
      items.push({
        name: `Sürekli Destek (${request.requirements.maintenanceMonths} ay)`,
        description:
          "Aylık performans takibi, optimizasyon önerileri, teknik destek",
        quantity: request.requirements.maintenanceMonths!,
        unitCost:
          pricing.maintenanceCost / request.requirements.maintenanceMonths!,
        totalCost: pricing.maintenanceCost,
        category: "MAINTENANCE",
      });
    }

    return items;
  }

  private getServiceName(serviceType: string): string {
    const names = {
      MENU_ANALYSIS: "Menü Analizi ve Optimizasyonu",
      PRICING_OPTIMIZATION: "Fiyatlandırma Stratejisi",
      FULL_CONSULTATION: "Kapsamlı Restoran Danışmanlığı",
      TRAINING: "Personel Eğitimi ve Gelişim",
      CUSTOM: "Özel Proje Danışmanlığı",
    };
    return (
      (names as Record<string, string>)[serviceType] || "Danışmanlık Hizmeti"
    );
  }

  private getServiceDescription(
    serviceType: string,
    requirements: Record<string, unknown>
  ): string {
    const scope = requirements.scope as string;
    const complexity = requirements.complexity as string;

    const descriptions = {
      MENU_ANALYSIS: `${scope} kapsamında ${complexity.toLowerCase()} seviye menü analizi, maliyet optimizasyonu ve performans raporlaması`,
      PRICING_OPTIMIZATION: `${scope} için ${complexity.toLowerCase()} fiyatlandırma stratejisi, rekabet analizi ve kar marjı optimizasyonu`,
      FULL_CONSULTATION: `${scope} kapsamında ${complexity.toLowerCase()} seviye tam danışmanlık, sistem kurulumu ve süreç optimizasyonu`,
      TRAINING: `${scope} için ${complexity.toLowerCase()} seviye personel eğitimi, süreç iyileştirme ve performans artırma`,
      CUSTOM: `${scope} kapsamında ${complexity.toLowerCase()} seviye özel proje yönetimi ve danışmanlık`,
    };

    return (
      (descriptions as Record<string, string>)[serviceType] ||
      "Profesyonel danışmanlık hizmeti"
    );
  }

  private basePricing = {
    MENU_ANALYSIS: 150,
    PRICING_OPTIMIZATION: 200,
    FULL_CONSULTATION: 300,
    TRAINING: 100,
    CUSTOM: 250,
  };
}

interface OfferItemData {
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  category: string;
}

// API Handlers
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate request
    const validationResult = await validateRequest(
      request,
      CreateOfferRequestSchema
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

    const data = validationResult.data as CreateOfferRequest;

    // Generate pricing
    const pricingEngine = new OfferPricingEngine();
    const pricing = pricingEngine.calculateOfferPricing(data);

    // Generate offer items
    const itemGenerator = new OfferItemGenerator();
    const offerItems = itemGenerator.generateOfferItems(data, pricing);

    // PT Eşitlik Assertion - HARD (yazım yolu) - Sert kontrol
    const itemsTotal = offerItems.reduce(
      (sum, item) => sum + (item.totalCost || 0),
      0
    );
    const difference = Math.abs(itemsTotal - pricing.finalPrice);
    const tolerance = 0.01; // 1 cent tolerance

    if (difference > tolerance) {
      // SEV-1 Critical Error: PT Equality Violation in WRITE path
      const ptError = {
        severity: "SEV-1",
        code: "PT_MISMATCH_WRITE",
        message: "Offer total does not equal sum of item costs",
        details: {
          itemsTotal,
          finalPrice: pricing.finalPrice,
          difference,
          tolerance,
          items: offerItems.length,
        },
        timestamp: new Date().toISOString(),
      };

      console.error("SEV-1 PT_MISMATCH_WRITE:", ptError);

      // Record metric
      await db.sLIMetric.create({
        data: {
          name: "pt_mismatch_count",
          value: 1,
          timestamp: new Date(),
          labels: { endpoint: "offers_post", severity: "SEV-1" },
          details: ptError.details,
        },
      });

      return NextResponse.json(
        createApiResponse(
          false,
          null,
          `Critical pricing error: Item total mismatch (${difference.toFixed(
            2
          )} TRY)`,
          "PT_MISMATCH_ERROR"
        ),
        { status: 500 }
      );
    }

    // Validate tender exists (foreign key safety)
    const tender = await db.tender.findUnique({ where: { id: data.tenderId } });
    if (!tender) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          "Geçersiz tenderId: ilgili ihale bulunamadı",
          "TENDER_NOT_FOUND"
        ),
        { status: 400 }
      );
    }

    // Generate simulationId for idempotent operations - now required (NOT NULL)
    const simulationId = `sim_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create offer in database with new schema
    const offer = await db.offer.create({
      data: {
        tenderId: data.tenderId,
        totalAmount: pricing.finalPrice,
        simulationId: simulationId, // Required for idempotent operations
        itemsData: JSON.parse(JSON.stringify(offerItems)),
        metadata: {
          // Core offer data
          title: data.title,
          description: data.description,
          // Client information (from transform)
          clientId: data.metadata?.clientId,
          restaurantId: data.restaurantId,
          // Pricing breakdown
          totalCost: pricing.totalCost,
          materialCost: pricing.materialCost,
          laborCost: pricing.laborCost,
          overheadCost: pricing.overheadCost,
          profitMargin: pricing.profitMarginPercent,
          estimatedRevenue: pricing.finalPrice,
          // Service details
          serviceType: data.serviceType,
          scope: data.requirements.scope,
          complexity: data.requirements.complexity,
          urgency: data.requirements.urgency,
          // Metadata fields
          docHash: data.metadata?.docHash,
          source: data.metadata?.source || "manual",
          tags: data.metadata?.tags || [
            data.serviceType,
            data.requirements.scope,
            data.requirements.complexity,
          ],
          // Timeline
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          deadline:
            data.requirements.urgency === "CRITICAL"
              ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          priority:
            data.requirements.urgency === "CRITICAL"
              ? "HIGH"
              : data.requirements.urgency === "URGENT"
              ? "MEDIUM"
              : "LOW",
        },
      },
    });

    // Return only new schema fields, no legacy fields
    return NextResponse.json(
      createApiResponse(
        true,
        {
          offer: {
            id: offer.id,
            tenderId: offer.tenderId,
            totalAmount: offer.totalAmount,
            metadata: offer.metadata,
            createdAt: offer.createdAt,
            updatedAt: offer.updatedAt,
          },
          pricing: {
            totalCost: pricing.totalCost,
            materialCost: pricing.materialCost,
            laborCost: pricing.laborCost,
            overheadCost: pricing.overheadCost,
            finalPrice: pricing.finalPrice,
            profitMarginPercent: pricing.profitMarginPercent,
          },
          estimatedDelivery: (offer.metadata as Record<string, unknown>)
            ?.deadline,
        },
        "Teklif başarıyla oluşturuldu"
      )
    );
  } catch (error) {
    console.error("Create offer error:", error);
    return NextResponse.json(
      createApiResponse(false, null, "Sunucu hatası", "SERVER_ERROR"),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause - use current schema fields
    const where: Record<string, unknown> = {};
    if (clientId) where.metadata = { path: ["clientId"], equals: clientId };
    // Note: status field not available in current schema - use metadata for status filtering
    if (status) where.metadata = { path: ["status"], equals: status };

    const [offers, total] = await Promise.all([
      db.offer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          // Current schema fields only
          id: true,
          totalAmount: true,
          itemsData: true,
          metadata: true,
          simulationId: true,
          createdAt: true,
          updatedAt: true,
          // itemsData JSON'u kullan - items ilişkisi kaldırıldı
          tender: {
            select: {
              id: true,
              title: true,
              institutionName: true,
            },
          },
        },
      }),
      db.offer.count({ where }),
    ]);

    // Simplified summary statistics - only essential metrics
    const basicStats = await db.offer.aggregate({
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: { id: true },
    });

    const summary = {
      totalOffers: total,
      totalRevenue: Math.round((basicStats._sum.totalAmount || 0) * 100) / 100,
      averageValue: Math.round((basicStats._avg.totalAmount || 0) * 100) / 100,
      // Remove complex win rate and growth calculations for now
      schema_version: "v2.0", // Indicate new simplified schema
    };

    // PT Eşitlik Assertion - ZARIF (okuma yolu) - Data göster, gözlemle
    let ptMismatchCount = 0;
    const healthInfo: {
      pt_consistent: boolean;
      inconsistent_offers?: Array<{
        offerId: string;
        delta: string;
        advice: string;
      }>;
    } = { pt_consistent: true };

    for (const offer of offers) {
      const itemsData = (offer.itemsData as Record<string, unknown>[]) || [];
      const itemsTotal = itemsData.reduce(
        (sum: number, item: Record<string, unknown>) =>
          sum +
          ((item.totalPrice as number) || (item.totalCost as number) || 0),
        0
      );

      const difference = Math.abs(itemsTotal - offer.totalAmount);
      const tolerance = 0.01;

      if (difference > tolerance) {
        ptMismatchCount++;

        // Mark health as inconsistent but continue serving data
        healthInfo.pt_consistent = false;
        healthInfo.inconsistent_offers = healthInfo.inconsistent_offers || [];
        healthInfo.inconsistent_offers.push({
          offerId: offer.id,
          delta: difference.toFixed(2),
          advice: "Recalculate from itemsData",
        });

        console.warn("PT_MISMATCH_READ (graceful):", {
          offerId: offer.id,
          itemsTotal,
          totalAmount: offer.totalAmount,
          difference: difference.toFixed(2),
          tolerance,
          action: "serving_data_with_warning",
        });
      }
    }

    // Log PT mismatch metric
    if (ptMismatchCount > 0) {
      await db.sLIMetric.create({
        data: {
          name: "pt_mismatch_count",
          value: ptMismatchCount,
          timestamp: new Date(),
          labels: { endpoint: "offers_get", total_offers: offers.length },
          details: { mismatch_count: ptMismatchCount },
        },
      });
    }

    return NextResponse.json(
      createApiResponse(
        true,
        {
          offers,
          summary,
          health: healthInfo, // PT consistency health info
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        "Teklifler listelendi"
      )
    );
  } catch (error) {
    console.error("Get offers error:", error);
    return NextResponse.json(
      createApiResponse(false, null, "Sunucu hatası", "SERVER_ERROR"),
      { status: 500 }
    );
  }
}

// CORS/preflight convenience and to avoid 405 on non-supported methods
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { headers: { Allow: "GET, POST, OPTIONS" } });
}
