import { ingestPDF } from "@/lib/ingest";
import { analyzeMenu } from "@/lib/menu/analyze";
import { calculateOffer } from "@/lib/offer/calc";
import {
  runReasoning,
  generateDetailedReport,
} from "@/lib/reasoning/core/engine";
import { log } from "@/lib/utils/logger";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { respond, panel } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// 🧠 Akıllı Pipeline - Reasoning ile güçlendirilmiş
async function handleIntelligentPipeline(request: Request): Promise<Response> {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // Dosya kontrolü
    if (!file) {
      return respond.validation({ file: "PDF dosyası gerekli" });
    }

    if (file.type !== "application/pdf") {
      return respond.validation({ file: "Sadece PDF dosyaları destekleniyor" });
    }

    log.info("Intelligent pipeline started", {
      fileName: file.name,
      fileSize: file.size,
    });

    // 1️⃣ PDF İngest
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = `/tmp/${Date.now()}_${file.name}`;

    // Node.js fs kullanarak geçici dosya oluştur
    const fs = await import("fs");
    fs.writeFileSync(tempPath, buffer);

    const pdfData = await ingestPDF(tempPath);

    // Geçici dosyayı temizle
    fs.unlinkSync(tempPath);

    // 2️⃣ Menu Analysis
    const fullText = pdfData.sections
      .map((section) => section.content)
      .join("\n");
    const menuAnalysis = analyzeMenu(fullText);

    // 3️⃣ Market Data (simulated)
    const marketData = {
      averagePrices: {
        protein: 25.5,
        carb: 8.75,
        fat: 18.25,
        vegetables: 12.3,
      },
      priceVariation: 0.15,
      lastUpdated: new Date().toISOString(),
    };

    // 4️⃣ Offer Calculation (default values)
    const materialCost = 100;
    const laborCost = 80;
    const overheadRate = 0.15;
    const profitRate = 0.2;

    const offerResult = calculateOffer({
      materialCost,
      laborCost,
      overheadRate,
      profitRate,
    });

    // 🧠 5️⃣ COGNITIVE REASONING - Yeni!
    const reasoning = runReasoning(menuAnalysis, offerResult);
    const detailedReport = generateDetailedReport(menuAnalysis, offerResult);

    // Panel data with reasoning
    const panelData = {
      menu: panel.menu(menuAnalysis),
      costs: panel.costs({
        averagePrices: marketData.averagePrices,
        laborCost,
        overheadCost: materialCost * overheadRate,
        totalCost: offerResult.totalCost,
      }),
      offer: panel.offer(offerResult),

      // 🧠 Yeni: Akıllı analiz sonuçları
      reasoning: {
        score: reasoning.score,
        riskLevel:
          reasoning.score >= 80
            ? "low"
            : reasoning.score >= 60
            ? "medium"
            : "high",
        risks: reasoning.risks,
        suggestions: reasoning.suggestions,
        compliance: reasoning.compliance,
        insights: reasoning.insights,
      },

      // 📊 Detaylı rapor
      report: detailedReport,

      meta: panel.meta(95, Date.now() - startTime),
    };

    const response = {
      // Raw data
      pdf: pdfData,
      menu: menuAnalysis,
      market: marketData,
      offer: offerResult,

      // 🧠 Akıllı analiz
      reasoning,

      // Pipeline metadata
      pipeline: {
        version: "v3.0-cognitive",
        steps: [
          "pdf-ingest",
          "menu-analysis",
          "market-data",
          "offer-calc",
          "cognitive-reasoning",
        ],
        processingTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      },
    };

    log.info("Intelligent pipeline completed", {
      processingTime: Date.now() - startTime,
      score: reasoning.score,
      risksCount: reasoning.risks.length,
      fileName: file.name,
    });

    return respond.ok(response, panelData, {
      processingTime: Date.now() - startTime,
      cognitiveScore: reasoning.score,
    });
  } catch (error: any) {
    log.error("Intelligent pipeline error", {
      error: error.message,
      processingTime: Date.now() - startTime,
    });

    return respond.serverError("Pipeline processing failed");
  }
}

// Rate limit: dakikada 5 full pipeline (resource intensive)
export const POST = withRateLimit(handleIntelligentPipeline, {
  limit: 5,
  windowMs: 60000,
});
