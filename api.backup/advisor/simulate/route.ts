import { runSimulation } from "@/lib/advisor/simulator";
import { rateLimit } from "@/lib/middleware/rateLimit";
import { log } from "@/lib/utils/logger";
import { fail, ok } from "@/lib/utils/response";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";

  // Rate limit kontrolü
  let allowed = true;
  try {
    allowed = rateLimit(ip);
  } catch {
    allowed = true;
  }
  if (!allowed) {
    return NextResponse.json(fail("Çok fazla istek. Lütfen bekleyin.", 429));
  }

  // JSON body parse
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail("Geçersiz JSON formatı.", 400));
  }

  try {
    const { menu, offer, adjustments } = body;

    // Debug: gelen veriyi logla
    log.debug("Advisor simulate request", { menu, offer, adjustments });

    if (menu == null || offer == null) {
      return NextResponse.json(fail("Eksik veri: menu veya offer bulunamadı", 400));
    }

    // Validation: menu.macroBalance kontrolü
    if (!menu.macroBalance || typeof menu.macroBalance.protein === "undefined") {
      return NextResponse.json(fail("Geçersiz menu formatı: macroBalance.protein bulunamadı", 400));
    }

    const result = runSimulation({ menu, offer, adjustments });
    log.info("Simulation tamamlandı", {
      ip,
      newScore: result.reasoning.score,
      adjustments,
    });

    return NextResponse.json(ok({ simulation: result }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata oluştu";
    log.error("Simulation hatası", { err: message });
    return NextResponse.json(fail("Simülasyon başarısız", 500, message));
  }
}
