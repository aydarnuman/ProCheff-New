import { NextResponse } from "next/server";
import { calculateOffer } from "@/lib/offer/calc";
import { log } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/errorHandler";
import { withValidation, OfferCalculationSchema } from "@/lib/middleware/validation";

export const dynamic = "force-dynamic";

// Güvenli handler
async function handleOfferCalculation(data: any, request: Request) {
  try {
    log.info("Offer calculation request", {
      materialCost: data.materialCost,
      laborCost: data.laborCost,
    });

    const result = calculateOffer({
      materialCost: data.materialCost,
      laborCost: data.laborCost,
      overheadRate: data.overheadRate,
      profitRate: data.profitMargin, // Schema'da profitMargin olarak tanımlandı
    });

    log.info("Teklif hesaplandı", { offerPrice: result.offerPrice });

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    log.error("Offer calculation error", { error });
    throw error; // Error boundary yakalayacak
  }
}

// Güvenlik middleware'leri ile wrapped handler
export const POST = withSecurity(withValidation(OfferCalculationSchema, handleOfferCalculation), {
  allowedMethods: ["POST"],
  rateLimit: true,
});
