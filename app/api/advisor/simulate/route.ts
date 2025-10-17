import { NextResponse } from "next/server";
import { runSimulation } from "@/lib/advisor/simulator";
import { ok, fail } from "@/lib/utils/response";
import { rateLimit } from "@/lib/middleware/rateLimit";
import { log } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip)) {
      return NextResponse.json(fail("Çok fazla istek. Lütfen bekleyin.", 429));
    }

    const body = await req.json();
    const { menu, offer, adjustments } = body;

    if (!menu || !offer) {
      return NextResponse.json(
        fail("Eksik veri: menu veya offer bulunamadı", 400)
      );
    }

    const result = runSimulation({ menu, offer, adjustments });
    log.info("Simulation tamamlandı", { newScore: result.reasoning.score });

    return NextResponse.json(ok({ simulation: result }));
  } catch (err: any) {
    log.error("Simulation hatası", { err: err.message });
    return NextResponse.json(fail("Simülasyon başarısız", 500));
  }
}
