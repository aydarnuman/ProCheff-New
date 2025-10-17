import { NextResponse } from "next/server";
import { analyzeMenu } from "@/lib/menu/analyze";
import { log } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";

    if (!text.trim()) {
      return NextResponse.json({ error: "Metin boş olamaz." }, { status: 400 });
    }

    const result = analyzeMenu(text);
    log.info("Menü analizi tamamlandı", { totalItems: result.totalItems });
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    log.error("Menu analyze hatası", { err: err.message });
    return NextResponse.json(
      { error: "Analiz hatası", detail: err.message },
      { status: 500 }
    );
  }
}
