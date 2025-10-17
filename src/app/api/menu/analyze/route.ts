import { NextResponse } from "next/server";
import { analyzeMenu } from "@/lib/menu/analyze";
import { log } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/errorHandler";
import {
  withValidation,
  MenuAnalysisSchema,
} from "@/lib/middleware/validation";

export const dynamic = "force-dynamic";

// Güvenli handler
async function handleMenuAnalysis(data: any, request: Request) {
  try {
    log.info("Menu analysis request", { textLength: data.text.length });

    const menuAnalysis = analyzeMenu(data.text);

    // Panel-friendly response
    const result = {
      success: true,
      data: menuAnalysis,
      panelData: {
        menu: {
          type: menuAnalysis.menuType,
          items: menuAnalysis.totalItems,
          nutrition: {
            protein: menuAnalysis.macroBalance.protein,
            fat: menuAnalysis.macroBalance.fat,
            carb: menuAnalysis.macroBalance.carb,
          },
          warnings: menuAnalysis.warnings,
        },
        risks: {
          nutritional: menuAnalysis.warnings,
          financial: [],
          compliance: [],
        },
        meta: {
          processedAt: new Date().toISOString(),
          confidence: menuAnalysis.totalItems > 0 ? 85 : 30,
        },
      },
    };

    log.info("Menü analizi tamamlandı", {
      totalItems: menuAnalysis.totalItems,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    log.error("Menu analysis error", { error });
    throw error; // Error boundary yakalayacak
  }
}

// Güvenlik middleware'leri ile wrapped handler
export const POST = withSecurity(
  withValidation(MenuAnalysisSchema, handleMenuAnalysis),
  {
    allowedMethods: ["POST"],
    rateLimit: true,
  }
);
