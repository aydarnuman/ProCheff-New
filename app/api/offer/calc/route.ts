import { NextResponse } from "next/server";
import { calculateOffer } from "@/lib/offer/calc";
import { log } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { materialCost, laborCost, overheadRate, profitRate } = body;

    if ([materialCost, laborCost, overheadRate, profitRate].some(v => v === undefined)) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    const result = calculateOffer({ materialCost, laborCost, overheadRate, profitRate });
    log.info("Teklif hesaplandı", { offerPrice: result.offerPrice });
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    log.error("Teklif hesap hatası", { err: err.message });
    return NextResponse.json(
      { error: "Teklif hesaplama başarısız", detail: err.message },
      { status: 500 }
    );
  }
}