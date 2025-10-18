import { analyzeMenu, analyzeMenuWithAI } from "@/lib/menu/analyze";
import { withSecurity } from "@/lib/middleware/errorHandler";
import { MenuAnalysisSchema, withValidation } from "@/lib/middleware/validation";
import { log } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Güvenli handler
async function handleMenuAnalysis(data: any, request: Request) {
  try {
    log.info("Menu analysis request", { 
      textLength: data.text.length,
      aiEnabled: data.useAI !== false 
    });

    // AI analizi kullan (varsayılan) veya fallback
    const menuAnalysis = data.useAI !== false 
      ? await analyzeMenuWithAI(data.text)
      : analyzeMenu(data.text);

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
          aiPowered: menuAnalysis.aiPowered,
          itemDetails: menuAnalysis.items?.slice(0, 5), // İlk 5 item
        },
        risks: {
          nutritional: menuAnalysis.warnings,
          financial: [],
          compliance: [],
        },
        meta: {
          processedAt: new Date().toISOString(),
          confidence: menuAnalysis.aiPowered ? 95 : (menuAnalysis.totalItems > 0 ? 85 : 30),
          analysisMethod: menuAnalysis.aiPowered ? 'AI' : 'Regex',
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
export const POST = withSecurity(withValidation(MenuAnalysisSchema, handleMenuAnalysis), {
  allowedMethods: ["POST"],
  rateLimit: true,
});
