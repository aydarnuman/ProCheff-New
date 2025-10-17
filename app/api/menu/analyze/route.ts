import { NextResponse } from "next/server";
import { analyzeMenu } from "@/lib/menu/analyze";
import { log } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";

    if (!text.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Metin boş olamaz.",
        },
        { status: 400 }
      );
    }

    const menuAnalysis = analyzeMenu(text);

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
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    log.error("Menu analyze hatası", { err: err.message });
    return NextResponse.json(
      { error: "Analiz hatası", detail: err.message },
      { status: 500 }
    );
  }
}
