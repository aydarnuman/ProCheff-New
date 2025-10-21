import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";

const prisma = new PrismaClient();

// Helper function for API responses
function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// Simple validation helper
function validateRequired(data: Record<string, unknown>, fields: string[]) {
  const missing = fields.filter((field) => !data[field]);
  return {
    isValid: missing.length === 0,
    errors: missing.map((field) => `${field} is required`),
  };
}

// İhale Service Engine - Real Business Logic
class TenderEngine {
  static calculateTenderScore(
    requirements: Record<string, unknown>,
    capabilities: Record<string, unknown>
  ): number {
    // Cast to any for complex business logic - detailed typing would require extensive refactoring
    const req = requirements as Record<string, any>;
    const cap = capabilities as Record<string, any>;
    let score = 0;
    let maxScore = 0;

    // Technical capability scoring (40%)
    const techWeight = 40;
    if (req.technicalRequirements) {
      req.technicalRequirements.forEach((reqItem: unknown) => {
        maxScore += techWeight;
        const capability = cap.technical?.find(
          (capItem: unknown) => (capItem as any).type === (reqItem as any).type
        );
        if (capability) {
          score +=
            ((capability as any).level / (reqItem as any).minLevel) *
            techWeight;
        }
      });
    }

    // Experience scoring (20%)
    const expWeight = 20;
    maxScore += expWeight;
    if (cap.experience && req.minExperience) {
      score += Math.min(cap.experience / req.minExperience, 2) * expWeight;
    }

    // Budget alignment scoring (20%)
    const budgetWeight = 20;
    maxScore += budgetWeight;
    if (cap.proposedBudget && req.budget) {
      const budgetDiff =
        1 - Math.abs(cap.proposedBudget - req.budget) / req.budget;
      score += Math.max(0, budgetDiff) * budgetWeight;
    }

    // Timeline scoring (20%)
    const timelineWeight = 20;
    maxScore += timelineWeight;
    if (cap.proposedTimeline && req.timeline) {
      const timelinePenalty =
        Math.max(0, cap.proposedTimeline - req.timeline) / req.timeline;
      score += Math.max(0, 1 - timelinePenalty) * timelineWeight;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  static generateTenderRequirements(
    type: string,
    scope: string
  ): Record<string, unknown> {
    const baseRequirements = {
      MENU_ANALYSIS: {
        technical: [
          {
            type: "AI_ANALYSIS",
            minLevel: 3,
            description: "AI destekli menü analizi",
          },
          {
            type: "NUTRITION_CALCULATION",
            minLevel: 2,
            description: "Beslenme değeri hesaplama",
          },
          {
            type: "COST_OPTIMIZATION",
            minLevel: 3,
            description: "Maliyet optimizasyonu",
          },
        ],
        certifications: ["ISO 22000", "HACCP"],
        minExperience: 3, // years
        timeline: 30, // days
        deliverables: [
          "Detaylı menü analiz raporu",
          "Maliyet optimizasyon önerileri",
          "Beslenme değeri analizi",
          "6 ay teknik destek",
        ],
      },
      PRICING_OPTIMIZATION: {
        technical: [
          {
            type: "MARKET_ANALYSIS",
            minLevel: 4,
            description: "Pazar analizi",
          },
          {
            type: "DYNAMIC_PRICING",
            minLevel: 3,
            description: "Dinamik fiyatlandırma",
          },
          {
            type: "COMPETITIVE_ANALYSIS",
            minLevel: 3,
            description: "Rekabet analizi",
          },
        ],
        certifications: ["MBA", "PMP"],
        minExperience: 5,
        timeline: 45,
        deliverables: [
          "Fiyatlandırma stratejisi",
          "Rekabet analizi raporu",
          "Dinamik fiyat modeli",
          "Performans takip dashboard'u",
        ],
      },
      FULL_CONSULTATION: {
        technical: [
          {
            type: "RESTAURANT_MANAGEMENT",
            minLevel: 5,
            description: "Restoran yönetimi",
          },
          {
            type: "DIGITAL_TRANSFORMATION",
            minLevel: 4,
            description: "Dijital dönüşüm",
          },
          {
            type: "OPERATIONAL_EXCELLENCE",
            minLevel: 4,
            description: "Operasyonel mükemmellik",
          },
        ],
        certifications: ["MBA", "ISO 9001", "Six Sigma"],
        minExperience: 7,
        timeline: 90,
        deliverables: [
          "Kapsamlı restoran analizi",
          "Dijital dönüşüm roadmap'i",
          "Operasyonel iyileştirme planı",
          "12 ay stratejik danışmanlık",
        ],
      },
    };

    const scopeMultipliers = {
      SINGLE_MENU: 1.0,
      RESTAURANT_CHAIN: 2.5,
      FRANCHISE_SYSTEM: 4.0,
      MARKET_SEGMENT: 6.0,
    };

    const requirements =
      baseRequirements[type as keyof typeof baseRequirements] ||
      baseRequirements.MENU_ANALYSIS;
    const multiplier =
      scopeMultipliers[scope as keyof typeof scopeMultipliers] || 1.0;

    return {
      ...requirements,
      timeline: Math.round(requirements.timeline * multiplier),
      minExperience: Math.round(
        requirements.minExperience * Math.sqrt(multiplier)
      ),
      complexity:
        multiplier >= 2.5 ? "HIGH" : multiplier >= 1.5 ? "MEDIUM" : "LOW",
    };
  }

  static calculateBudgetRange(
    type: string,
    scope: string
  ): { min: number; max: number; suggested: number } {
    const basePrices = {
      MENU_ANALYSIS: 15000,
      PRICING_OPTIMIZATION: 25000,
      FULL_CONSULTATION: 50000,
      DIGITAL_TRANSFORMATION: 75000,
      OPERATIONAL_AUDIT: 20000,
    };

    const scopeMultipliers = {
      SINGLE_MENU: 1.0,
      RESTAURANT_CHAIN: 2.5,
      FRANCHISE_SYSTEM: 4.0,
      MARKET_SEGMENT: 6.0,
    };

    const basePrice = basePrices[type as keyof typeof basePrices] || 15000;
    const multiplier =
      scopeMultipliers[scope as keyof typeof scopeMultipliers] || 1.0;
    const suggested = Math.round(basePrice * multiplier);

    return {
      min: Math.round(suggested * 0.7),
      max: Math.round(suggested * 1.5),
      suggested,
    };
  }
}

// GET - Fetch All Tenders with Advanced Filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const budget = searchParams.get("budget");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build filter conditions
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (budget) {
      const budgetNum = parseFloat(budget);
      where.budget = { lte: budgetNum * 1.2, gte: budgetNum * 0.8 };
    }

    const tenders = await prisma.tender.findMany({
      where,
      include: {
        restaurant: {
          select: { name: true, cuisine: true, address: true },
        },
        bids: {
          include: {
            offer: {
              select: {
                id: true,
                tenderId: true,
                totalAmount: true,
                metadata: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate statistics
    const totalTenders = await prisma.tender.count({ where });
    const activeTenders = await prisma.tender.count({
      where: { ...where, status: "OPEN" },
    });

    // Process tender data with real business logic
    const processedTenders = tenders.map((tender: Record<string, unknown>) => {
      const tenderAny = tender as Record<string, any>; // Complex business logic with dynamic properties
      const requirements = TenderEngine.generateTenderRequirements(
        tenderAny.requirements?.type || "MENU_ANALYSIS",
        tenderAny.requirements?.scope || "SINGLE_MENU"
      );

      const budgetRange = TenderEngine.calculateBudgetRange(
        (tender.requirements as any)?.type || "MENU_ANALYSIS",
        (tender.requirements as any)?.scope || "SINGLE_MENU"
      );

      // Calculate bid statistics
      const bidStats = {
        total: tenderAny.bids.length,
        averageBid:
          tenderAny.bids.length > 0
            ? tenderAny.bids.reduce(
                (sum: number, bid: Record<string, unknown>) =>
                  sum + (bid.bidAmount as number),
                0
              ) / tenderAny.bids.length
            : 0,
        lowestBid:
          tenderAny.bids.length > 0
            ? Math.min(
                ...tenderAny.bids.map(
                  (bid: Record<string, unknown>) => bid.bidAmount as number
                )
              )
            : 0,
        highestBid:
          tenderAny.bids.length > 0
            ? Math.max(
                ...tenderAny.bids.map(
                  (bid: Record<string, unknown>) => bid.bidAmount as number
                )
              )
            : 0,
      };

      return {
        ...tender,
        requirements,
        budgetRange,
        bidStats,
        competitiveness:
          bidStats.total > 3 ? "HIGH" : bidStats.total > 1 ? "MEDIUM" : "LOW",
        daysLeft: Math.max(
          0,
          Math.ceil(
            (new Date(tenderAny.deadline).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        ),
      };
    });

    return apiResponse({
      success: true,
      data: {
        tenders: processedTenders,
        pagination: {
          page,
          limit,
          total: totalTenders,
          pages: Math.ceil(totalTenders / limit),
        },
        statistics: {
          total: totalTenders,
          active: activeTenders,
          averageBudget:
            processedTenders.reduce(
              (sum: number, t: Record<string, unknown>) =>
                sum + ((t.budget as number) || 0),
              0
            ) / Math.max(processedTenders.length, 1),
        },
      },
    });
  } catch (error) {
    console.error("Tenders GET error:", error);
    return apiResponse(
      {
        success: false,
        error: "İhaleler getirilirken hata oluştu",
      },
      500
    );
  }
}

// CORS/preflight convenience
export async function OPTIONS() {
  return NextResponse.json({}, { headers: { Allow: "GET, POST, OPTIONS" } });
}

// POST - Create New Tender with Sophisticated Requirements
export async function POST(request: NextRequest) {
  try {
    // Skip auth for testing
    const authResult = { user: { id: "cmgzc97rj000061yiupfz4mes" } };

    const body = await request.json();
    const {
      title,
      description,
      restaurantId,
      type,
      scope,
      budget,
      deadline,
      customRequirements,
    } = body;

    // Validate required fields
    const validation = validateRequired(body, [
      "title",
      "description",
      "type",
      "scope",
      "deadline",
    ]);
    if (!validation.isValid) {
      return apiResponse(
        {
          success: false,
          error: "Gerekli alanlar eksik",
          details: validation.errors,
        },
        400
      );
    }

    // Generate sophisticated requirements using TenderEngine
    const generatedRequirements = TenderEngine.generateTenderRequirements(
      type,
      scope
    );
    const budgetRange = TenderEngine.calculateBudgetRange(type, scope);

    // Merge custom requirements with generated ones
    const finalRequirements = {
      ...generatedRequirements,
      type,
      scope,
      budgetRange,
      customRequirements: customRequirements || [],
      evaluationCriteria: {
        technical: 40,
        experience: 30,
        budget: 20,
        timeline: 10,
      },
      additionalInfo: {
        preferredStartDate: new Date(
          new Date().getTime() + 7 * 24 * 60 * 60 * 1000
        ), // 1 week from now
        communicationPreference: "EMAIL",
        reportingFrequency: "WEEKLY",
        successMetrics: [
          "Müşteri memnuniyeti artışı",
          "Operasyonel verimlilik iyileştirmesi",
          "Maliyet optimizasyonu",
          "Gelir artışı",
        ],
      },
    };

    // Create tender in database
    const tender = await prisma.tender.create({
      data: {
        title,
        description,
        restaurantId: restaurantId || "default-restaurant-id", // Need to handle this properly
        budget: budget || budgetRange.suggested,
        deadline: new Date(deadline),
        requirements: finalRequirements,
        status: "OPEN",
        publishedAt: new Date(),
      },
      include: {
        restaurant: {
          select: { name: true, cuisine: true, address: true },
        },
      },
    });

    // Trigger automation pipeline if analysis data exists
    try {
      const { triggerAutomationPipeline } = await import(
        "@/lib/workflow/automation"
      );

      // Check if there's associated analysis data to trigger pipeline
      if (body.analysisData) {
        // Run automation in background (don't await)
        triggerAutomationPipeline(
          tender.id,
          authResult.user.id,
          body.documentHash,
          body.analysisData
        ).catch((error) => {
          console.error(
            `Automation pipeline failed for tender ${tender.id}:`,
            error
          );
        });
      }
    } catch (error) {
      console.error("Failed to trigger automation pipeline:", error);
      // Don't fail the tender creation if automation fails
    }

    return apiResponse({
      success: true,
      data: {
        tender,
        message: "İhale başarıyla oluşturuldu",
        next_steps: [
          "İhale yayınlandı ve tedarikçilere görünür",
          "Teklifler deadline tarihine kadar alınacak",
          "Otomatik değerlendirme sistemi devrede",
          "Email bildirimleri aktif",
        ],
      },
    });
  } catch (error) {
    console.error("Tender creation error:", error);
    return apiResponse(
      {
        success: false,
        error: "İhale oluşturulurken hata oluştu",
      },
      500
    );
  }
}
