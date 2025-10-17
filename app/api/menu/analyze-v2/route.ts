import { analyzeMenu } from "@/lib/menu/analyze";
import { log } from "@/lib/utils/logger";
import { secureEndpoint, type AuthContext } from "@/lib/middleware";
import { MenuAnalysisSchema } from "@/lib/middleware/validation";

export const dynamic = "force-dynamic";

// Güvenli handler
async function handleMenuAnalysis(
  data: any,
  request: Request,
  context?: AuthContext
) {
  try {
    log.info("Menu analysis request", {
      textLength: data.text.length,
      keyId: context?.apiKey?.id,
    });

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
          compliance: [],
          financial: [],
        },
        meta: {
          processedAt: new Date().toISOString(),
          confidence: menuAnalysis.totalItems > 0 ? 85 : 30,
        },
      },
    };

    log.info("Menü analizi tamamlandı", {
      totalItems: menuAnalysis.totalItems,
      keyId: context?.apiKey?.id,
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
export const POST = secureEndpoint.menuAnalysis(
  // Validation wrapper'ını manuel olarak ekliyoruz
  async (request: Request, context?: AuthContext) => {
    try {
      const data = await request.json();
      const validatedData = MenuAnalysisSchema.parse(data);
      return handleMenuAnalysis(validatedData, request, context);
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: "Validation failed",
              code: 400,
              type: "VALIDATION_ERROR",
              details: error.message,
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }
  }
);
