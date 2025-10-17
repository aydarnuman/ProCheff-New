import { NextResponse } from "next/server";
import { ingestPDF } from "@/lib/ingest";
import { analyzeMenu } from "@/lib/menu/analyze";
import {
  fetchA101Prices,
  fetchBIMPrices,
  fetchMigrosPrices,
  fetchSOKPrices,
  calculateAveragePrices,
} from "@/lib/market";
import { calculateOffer } from "@/lib/offer/calc";
import { log } from "@/lib/utils/logger";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const startTime = Date.now();
    log.info("Starting PDF-to-Offer pipeline");

    // 1. PDF Upload & Parse
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const laborCost = Number(formData.get("laborCost")) || 4.5;
    const overheadRate = Number(formData.get("overheadRate")) || 5;
    const profitRate = Number(formData.get("profitRate")) || 8;

    if (!file) {
      return NextResponse.json(
        { error: "PDF dosyası gerekli" },
        { status: 400 }
      );
    }

    // Geçici dosya oluştur
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = "/tmp/uploads";
    const filename = `${Date.now()}_${file.name}`;
    const fullPath = path.join(uploadDir, filename);

    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(fullPath, buffer);

    // 2. PDF İngest - Section Parsing
    log.info("Step 1: PDF Ingest", { filename: file.name });
    const ingestResult = await ingestPDF(fullPath);

    // Geçici dosyayı temizle
    fs.unlinkSync(fullPath);

    // 3. Menu Analysis - Beslenme Analizi
    log.info("Step 2: Menu Analysis", {
      sections: ingestResult.sections.length,
    });
    const menuSections = ingestResult.sections.filter((s) =>
      /menü|yemek|çorba|ana.*yemek|tatlı|salata/i.test(s.title)
    );

    const menuAnalysis =
      menuSections.length > 0
        ? analyzeMenu(menuSections.map((s) => s.content).join("\n"))
        : {
            menuType: "Belirsiz",
            macroBalance: { protein: 0, fat: 0, carb: 0 },
            warnings: [],
            totalItems: 0,
          };

    // 4. Market Price Intelligence
    log.info("Step 3: Market Price Fetching");
    const [a101Prices, bimPrices, migrosPrices, sokPrices] = await Promise.all([
      fetchA101Prices(),
      fetchBIMPrices(),
      fetchMigrosPrices(),
      fetchSOKPrices(),
    ]);

    const allPrices = [
      ...a101Prices,
      ...bimPrices,
      ...migrosPrices,
      ...sokPrices,
    ];
    const averagePrices = calculateAveragePrices(allPrices);

    // 5. Material Cost Estimation (basit algoritma)
    const estimatedMaterialCost = averagePrices
      .filter((p) =>
        [
          "Pirinç (Baldo)",
          "Dana Kıyma",
          "Tavuk But",
          "Soğan",
          "Domates",
        ].includes(p.product)
      )
      .reduce((sum, p) => sum + p.average * 0.5, 0); // Her üründen 500g varsayım

    // 6. Offer Calculation
    log.info("Step 4: Offer Calculation", {
      materialCost: estimatedMaterialCost,
    });
    const offerResult = calculateOffer({
      materialCost: estimatedMaterialCost,
      laborCost,
      overheadRate,
      profitRate,
    });

    const totalDuration = Date.now() - startTime;

    // Final Result
    const result = {
      pipeline: {
        status: "success",
        duration: `${totalDuration}ms`,
        steps: [
          "pdf-ingest",
          "menu-analysis",
          "price-intelligence",
          "offer-calculation",
        ],
      },
      pdf: {
        filename: file.name,
        sections: ingestResult.sections.length,
        menuSections: menuSections.length,
      },
      menuAnalysis,
      marketData: {
        sources: ["A101", "BİM", "Migros", "ŞOK"],
        products: averagePrices.length,
        estimatedMaterialCost,
      },
      offer: offerResult,
      summary: {
        menuType: menuAnalysis.menuType,
        totalItems: menuAnalysis.totalItems,
        materialCost: estimatedMaterialCost,
        finalOfferPrice: offerResult.offerPrice,
        profitMargin: `${profitRate}%`,
        kThreshold: offerResult.kThreshold,
      },
    };

    log.info("PDF-to-Offer pipeline completed successfully", {
      duration: totalDuration,
      offerPrice: offerResult.offerPrice,
      menuItems: menuAnalysis.totalItems,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    log.error("PDF-to-Offer pipeline failed", { err: err.message });
    return NextResponse.json(
      { error: "Pipeline başarısız", detail: err.message },
      { status: 500 }
    );
  }
}
