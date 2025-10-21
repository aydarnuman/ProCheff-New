import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/lib/core/auth";
import { prisma as db } from "@/lib/core/database";
import { validateRequest, createApiResponse } from "@/lib/api/validation";

const MenuAnalysisRequestSchema = z.object({
  menuText: z.string().min(10).max(50000),
  menuId: z.string().optional(),
  analysisType: z.enum(["full", "pricing", "nutrition"]).default("full"),
});

type MenuAnalysisRequest = z.infer<typeof MenuAnalysisRequestSchema>;

interface MenuItem {
  name: string;
  price?: number;
  category: string;
  estimatedCost: number;
  profitMargin: number;
}

interface AnalysisResults {
  success: boolean;
  menuItems: MenuItem[];
  summary: {
    totalItems: number;
    averagePrice: number;
    averageMargin: number;
  };
  recommendations: string[];
}

class MenuAnalyzer {
  analyzeMenu(menuText: string): AnalysisResults {
    try {
      const menuItems = this.parseMenuText(menuText);

      if (menuItems.length === 0) {
        return {
          success: false,
          menuItems: [],
          summary: { totalItems: 0, averagePrice: 0, averageMargin: 0 },
          recommendations: ["Menü metni anlaşılamadı"],
        };
      }

      const summary = this.calculateSummary(menuItems);
      const recommendations = this.generateRecommendations(summary);

      return {
        success: true,
        menuItems,
        summary,
        recommendations,
      };
    } catch (error) {
      return {
        success: false,
        menuItems: [],
        summary: { totalItems: 0, averagePrice: 0, averageMargin: 0 },
        recommendations: [
          `Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
        ],
      };
    }
  }

  private parseMenuText(menuText: string): MenuItem[] {
    const lines = menuText.split("\n").filter((line) => line.trim());
    const items: MenuItem[] = [];
    let currentCategory = "Diğer";

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (this.isCategory(trimmedLine)) {
        currentCategory = trimmedLine;
        continue;
      }

      const item = this.parseMenuItem(trimmedLine, currentCategory);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  private isCategory(line: string): boolean {
    return (
      line.toUpperCase() === line &&
      !this.extractPrice(line) &&
      line.length < 50
    );
  }

  private parseMenuItem(line: string, category: string): MenuItem | null {
    if (line.length < 3) return null;

    const price = this.extractPrice(line);
    const name = this.extractItemName(line, price);

    if (!name) return null;

    const estimatedCost = this.estimateCost(category);
    const profitMargin = price ? ((price - estimatedCost) / price) * 100 : 0;

    return {
      name,
      price,
      category,
      estimatedCost,
      profitMargin,
    };
  }

  private extractPrice(text: string): number | undefined {
    const priceRegex = /(\d+(?:[,.]\d{1,2})?)\s*(?:TL|₺|lira)/i;
    const match = text.match(priceRegex);
    return match ? parseFloat(match[1].replace(",", ".")) : undefined;
  }

  private extractItemName(line: string, price?: number): string {
    let name = line;
    if (price) {
      name = name.replace(/(\d+(?:[,.]\d{1,2})?)\s*(?:TL|₺|lira).*$/i, "");
    }
    return name.replace(/^[-•*]\s*/, "").trim();
  }

  private estimateCost(category: string): number {
    const baseCosts = {
      "Ana Yemekler": 15,
      Başlangıçlar: 8,
      Tatlılar: 6,
      İçecekler: 3,
    };
    return (baseCosts as any)[category] || 10;
  }

  private calculateSummary(items: MenuItem[]) {
    const pricedItems = items.filter((item) => item.price && item.price > 0);

    return {
      totalItems: items.length,
      averagePrice:
        pricedItems.length > 0
          ? Math.round(
              (pricedItems.reduce((sum, item) => sum + item.price!, 0) /
                pricedItems.length) *
                100
            ) / 100
          : 0,
      averageMargin:
        pricedItems.length > 0
          ? Math.round(
              (pricedItems.reduce((sum, item) => sum + item.profitMargin, 0) /
                pricedItems.length) *
                100
            ) / 100
          : 0,
    };
  }

  private generateRecommendations(summary: any): string[] {
    const recommendations: string[] = [];

    if (summary.averageMargin < 30) {
      recommendations.push(
        `Kar marjınız düşük (%${summary.averageMargin}). Fiyatları gözden geçirin.`
      );
    }

    if (summary.totalItems < 10) {
      recommendations.push("Menü çeşitliliğini artırın.");
    }

    return recommendations;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Skip auth for testing
    const authContext = { user: { id: "cmgzc97rj000061yiupfz4mes" } };

    // Validate request
    const validationResult = await validateRequest(
      request,
      MenuAnalysisRequestSchema
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

    const data = validationResult.data as MenuAnalysisRequest;
    const analyzer = new MenuAnalyzer();
    const results = analyzer.analyzeMenu(data.menuText);

    if (data.menuId && results.success) {
      try {
        await db.menuAnalysis.create({
          data: {
            menuId: data.menuId,
            type: data.analysisType.toUpperCase() as any,
            inputData: { menuText: data.menuText },
            results: JSON.parse(JSON.stringify(results)),
          },
        });
      } catch (dbError) {
        console.error("Database save error:", dbError);
      }
    }

    return NextResponse.json(
      createApiResponse(true, results, "Menü analizi tamamlandı")
    );
  } catch (error) {
    console.error("Menu analysis error:", error);
    return NextResponse.json(
      createApiResponse(false, null, "Sunucu hatası", "SERVER_ERROR"),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          "Kimlik doğrulama gerekli",
          "UNAUTHORIZED"
        ),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authContext = await verifyAuth(token);
    if (!authContext) {
      return NextResponse.json(
        createApiResponse(false, null, "Geçersiz token", "UNAUTHORIZED"),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get("menuId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where = menuId ? { menuId } : {};

    const [analyses, total] = await Promise.all([
      db.menuAnalysis.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          menu: {
            select: {
              name: true,
              restaurant: {
                select: { name: true },
              },
            },
          },
        },
      }),
      db.menuAnalysis.count({ where }),
    ]);

    return NextResponse.json(
      createApiResponse(
        true,
        {
          analyses,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        "Analizler listelendi"
      )
    );
  } catch (error) {
    console.error("Get analyses error:", error);
    return NextResponse.json(
      createApiResponse(false, null, "Sunucu hatası", "SERVER_ERROR"),
      { status: 500 }
    );
  }
}
