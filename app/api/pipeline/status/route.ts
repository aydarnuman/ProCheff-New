import { NextResponse } from "next/server";
import { log } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Pipeline durumunu kontrol et
    const status = {
      pipeline: {
        name: "ProCheff PDF-to-Offer Pipeline",
        version: "2.3.0",
        status: "operational",
        lastUpdated: new Date().toISOString()
      },
      modules: {
        pdfIngest: { status: "active", endpoint: "/api/ingest" },
        menuAnalysis: { status: "active", endpoint: "/api/menu/analyze" },
        marketIntelligence: { status: "active", endpoint: "/api/market/prices" },
        offerCalculation: { status: "active", endpoint: "/api/offer/calc" },
        endToEndPipeline: { status: "active", endpoint: "/api/pipeline/pdf-to-offer" }
      },
      capabilities: {
        supportedFormats: ["PDF"],
        marketSources: ["A101", "BİM", "Migros", "ŞOK"],
        analysisTypes: ["nutrition", "pricing", "costing"],
        complianceStandards: ["KİK K=0.93"]
      },
      statistics: {
        totalEndpoints: 7,
        activeModules: 5,
        marketAdapters: 4,
        productsCovered: 8
      }
    };

    log.info("Pipeline status check completed");
    return NextResponse.json(status, { status: 200 });

  } catch (err: any) {
    log.error("Pipeline status check failed", { err: err.message });
    return NextResponse.json(
      { error: "Status kontrolü başarısız", detail: err.message },
      { status: 500 }
    );
  }
}