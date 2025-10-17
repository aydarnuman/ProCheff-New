import { analyzeMenu } from "@/lib/menu/analyze";
import { log } from "@/lib/utils/logger";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { respond, panel } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// Basit menu analysis handler
async function handleMenuAnalysis(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const text = body.text;

    // Basit validation
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return respond.validation({
        text: "Text field is required and must be non-empty",
      });
    }

    if (text.length > 10000) {
      return respond.validation({
        text: "Text must be less than 10,000 characters",
      });
    }

    log.info("Menu analysis request", { textLength: text.length });

    const menuAnalysis = analyzeMenu(text);

    // Panel data kullanarak standart response
    const panelData = {
      menu: panel.menu(menuAnalysis),
      risks: panel.risks(menuAnalysis.warnings),
      meta: panel.meta(menuAnalysis.totalItems > 0 ? 85 : 30),
    };

    log.info("Menü analizi tamamlandı", {
      totalItems: menuAnalysis.totalItems,
    });

    return respond.ok(menuAnalysis, panelData);
  } catch (error: any) {
    log.error("Menu analysis error", { error: error.message });
    return respond.serverError("Menu analysis failed");
  }
}

// Rate limit ile korumalı endpoint
export const POST = withRateLimit(handleMenuAnalysis, {
  limit: 10,
  windowMs: 60000, // Dakikada 10 menu analizi
});
