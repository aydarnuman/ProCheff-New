import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/lib/core/auth";
import { prisma as db } from "@/lib/core/database";
import { validateRequest, createApiResponse } from "@/lib/api/validation";

// Request schemas
const CreateOfferRequestSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  clientId: z.string(),
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
    scope: z.enum(["SINGLE_MENU", "FULL_RESTAURANT", "CHAIN_STANDARDIZATION"]),
    urgency: z.enum(["STANDARD", "URGENT", "CRITICAL"]),
    complexity: z.enum(["BASIC", "ADVANCED", "ENTERPRISE"]),
    includeMaintenance: z.boolean().default(false),
    maintenanceMonths: z.number().min(1).max(12).optional(),
  }),
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
    const scopeMultiplier = this.scopeMultipliers[request.requirements.scope];
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

    return (baseHours as any)[serviceType]?.[scope] || 10;
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
    return ((baseMargins as any)[serviceType] || 0.25) + urgencyBonus;
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
    return (names as any)[serviceType] || "Danışmanlık Hizmeti";
  }

  private getServiceDescription(
    serviceType: string,
    requirements: any
  ): string {
    const scope = requirements.scope;
    const complexity = requirements.complexity;

    const descriptions = {
      MENU_ANALYSIS: `${scope} kapsamında ${complexity.toLowerCase()} seviye menü analizi, maliyet optimizasyonu ve performans raporlaması`,
      PRICING_OPTIMIZATION: `${scope} için ${complexity.toLowerCase()} fiyatlandırma stratejisi, rekabet analizi ve kar marjı optimizasyonu`,
      FULL_CONSULTATION: `${scope} kapsamında ${complexity.toLowerCase()} seviye tam danışmanlık, sistem kurulumu ve süreç optimizasyonu`,
      TRAINING: `${scope} için ${complexity.toLowerCase()} seviye personel eğitimi, süreç iyileştirme ve performans artırma`,
      CUSTOM: `${scope} kapsamında ${complexity.toLowerCase()} seviye özel proje yönetimi ve danışmanlık`,
    };

    return (
      (descriptions as any)[serviceType] || "Profesyonel danışmanlık hizmeti"
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
    // Skip auth for testing
    const authContext = { user: { id: "cmgzc97rj000061yiupfz4mes" } };

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

    // Create offer in database
    const offer = await db.offer.create({
      data: {
        title: data.title,
        description: data.description,
        clientId: data.clientId,
        restaurantId: data.restaurantId,
        totalCost: pricing.totalCost,
        materialCost: pricing.materialCost,
        laborCost: pricing.laborCost,
        overheadCost: pricing.overheadCost,
        profitMargin: pricing.profitMarginPercent,
        estimatedRevenue: pricing.finalPrice,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        deadline:
          data.requirements.urgency === "CRITICAL"
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        tags: JSON.stringify([
          data.serviceType,
          data.requirements.scope,
          data.requirements.complexity,
        ]),
        priority:
          data.requirements.urgency === "CRITICAL"
            ? "HIGH"
            : data.requirements.urgency === "URGENT"
            ? "MEDIUM"
            : "LOW",
        items: {
          create: offerItems.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            category: item.category,
          })),
        },
      },
      include: {
        items: true,
        client: {
          select: { name: true, email: true },
        },
        restaurant: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(
      createApiResponse(
        true,
        {
          offer,
          pricing,
          estimatedDelivery: offer.deadline,
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
    // Skip auth for testing
    const authContext = { user: { id: "cmgzc97rj000061yiupfz4mes" } };

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause
    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const [offers, total] = await Promise.all([
      db.offer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: true,
          client: {
            select: { name: true, email: true },
          },
          restaurant: {
            select: { name: true },
          },
        },
      }),
      db.offer.count({ where }),
    ]);

    // Calculate summary statistics
    const allOffers = await db.offer.findMany({
      where: clientId ? { clientId } : {},
      select: {
        status: true,
        estimatedRevenue: true,
        createdAt: true,
      },
    });

    const approvedOffers = allOffers.filter((o) => o.status === "APPROVED");
    const totalRevenue = approvedOffers.reduce(
      (sum, o) => sum + (o.estimatedRevenue || 0),
      0
    );
    const averageValue =
      allOffers.length > 0
        ? allOffers.reduce((sum, o) => sum + (o.estimatedRevenue || 0), 0) /
          allOffers.length
        : 0;
    const winRate =
      allOffers.length > 0
        ? (approvedOffers.length / allOffers.length) * 100
        : 0;

    // Calculate monthly growth (simplified)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const thisMonthOffers = allOffers.filter((o) => o.createdAt >= thisMonth);
    const lastMonthOffers = allOffers.filter(
      (o) => o.createdAt >= lastMonth && o.createdAt < thisMonth
    );

    const monthlyGrowth =
      lastMonthOffers.length > 0
        ? ((thisMonthOffers.length - lastMonthOffers.length) /
            lastMonthOffers.length) *
          100
        : 0;

    const summary = {
      totalOffers: total,
      winRate: Math.round(winRate * 100) / 100,
      averageValue: Math.round(averageValue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
    };

    return NextResponse.json(
      createApiResponse(
        true,
        {
          offers,
          summary,
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
