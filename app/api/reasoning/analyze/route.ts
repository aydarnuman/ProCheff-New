import { NextResponse } from "next/server";
import { runReasoning } from "@/lib/reasoning/core/engine";
import { log } from "@/lib/utils/logger";
import { ok, fail } from "@/lib/utils/response";
import { rateLimit, getClientIP } from "@/lib/middleware/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Rate limiting kontrolü
    const ip = getClientIP(req);
    if (!rateLimit(ip, 10, 60000)) {
      // Dakikada 10 reasoning analizi
      return NextResponse.json(fail("Çok fazla istek. Lütfen bekleyin.", 429));
    }

    const body = await req.json();
    const { menu, offer } = body;

    // Basit validation
    if (!menu || !offer) {
      return NextResponse.json(
        fail("Eksik veri: menu veya offer bulunamadı", 400)
      );
    }

    // Menu validation
    if (!menu.macroBalance || typeof menu.macroBalance.protein !== "number") {
      return NextResponse.json(
        fail("Geçersiz menu verisi: macroBalance.protein gerekli", 400)
      );
    }

    // Offer validation
    if (
      typeof offer.offerPrice !== "number" ||
      typeof offer.totalCost !== "number"
    ) {
      return NextResponse.json(
        fail("Geçersiz offer verisi: offerPrice ve totalCost gerekli", 400)
      );
    }

    log.info("Reasoning analiz başlatıldı", {
      menuType: menu.menuType,
      totalItems: menu.totalItems,
      offerPrice: offer.offerPrice,
      ip,
    });

    // 🧠 Cognitive reasoning çalıştır
    const reasoning = runReasoning(menu, offer);

    // Panel data formatına uygun response
    const panelData = {
      reasoning: {
        score: reasoning.score,
        riskLevel:
          reasoning.score >= 80
            ? "low"
            : reasoning.score >= 60
            ? "medium"
            : reasoning.score >= 40
            ? "high"
            : "critical",
        risks: reasoning.risks,
        suggestions: reasoning.suggestions,
        compliance: reasoning.compliance,
        insights: reasoning.insights || [],
      },
    };

    log.info("Reasoning analiz tamamlandı", {
      score: reasoning.score,
      risksCount: reasoning.risks.length,
      suggestionsCount: reasoning.suggestions.length,
      ip,
    });

    return NextResponse.json(
      ok({ reasoning }, panelData, {
        processingTime: "~50ms",
        engine: "cognitive-v3.0",
      })
    );
  } catch (err: any) {
    log.error("Reasoning hatası", {
      err: err.message,
      stack: err.stack,
      ip: getClientIP(req),
    });

    return NextResponse.json(
      fail(
        "Reasoning analizi başarısız",
        500,
        "REASONING_ERROR",
        process.env.NODE_ENV === "development" ? err.message : undefined
      )
    );
  }
}

// GET endpoint - reasoning engine status
export async function GET() {
  try {
    return NextResponse.json(
      ok({
        status: "active",
        engine: "ProCheff Cognitive Reasoning Engine v3.0",
        capabilities: [
          "Nutritional risk assessment",
          "Financial analysis",
          "KİK compliance checking",
          "Smart recommendations",
          "Risk scoring (0-100)",
        ],
        usage: {
          rateLimit: "10 requests per minute",
          requiredFields: [
            "menu.macroBalance",
            "offer.offerPrice",
            "offer.totalCost",
          ],
        },
      })
    );
  } catch (err: any) {
    return NextResponse.json(fail("Engine status check failed", 500));
  }
}
