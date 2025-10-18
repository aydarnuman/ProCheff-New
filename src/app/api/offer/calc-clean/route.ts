import { calculateOffer } from "@/lib/offer/calc";
import { log } from "@/lib/utils/logger";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { respond, panel } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

// Basit offer calculation handler
async function handleOfferCalculation(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { materialCost, laborCost, overheadRate, profitMargin } = body;

    // Basit validation
    const errors: any = {};

    if (typeof materialCost !== "number" || materialCost <= 0) {
      errors.materialCost = "Must be a positive number";
    }
    if (typeof laborCost !== "number" || laborCost <= 0) {
      errors.laborCost = "Must be a positive number";
    }
    if (typeof overheadRate !== "number" || overheadRate < 0 || overheadRate > 1) {
      errors.overheadRate = "Must be between 0 and 1";
    }
    if (typeof profitMargin !== "number" || profitMargin < 0 || profitMargin > 1) {
      errors.profitMargin = "Must be between 0 and 1";
    }

    if (Object.keys(errors).length > 0) {
      return respond.validation(errors);
    }

    log.info("Offer calculation request", {
      materialCost,
      laborCost,
    });

    const offerResult = calculateOffer({
      materialCost,
      laborCost,
      overheadRate,
      profitRate: profitMargin, // API uses profitMargin, lib uses profitRate
    });

    // Panel data
    const panelData = {
      offer: panel.offer(offerResult),
      costs: {
        materials: materialCost,
        labor: laborCost,
        overhead: materialCost * overheadRate,
        total: offerResult.totalCost,
      },
      meta: panel.meta(95), // High confidence for calculations
    };

    log.info("Teklif hesaplandı", {
      offerPrice: offerResult.offerPrice,
    });

    return respond.ok(offerResult, panelData);
  } catch (error: any) {
    log.error("Offer calculation error", { error: error.message });
    return respond.serverError("Offer calculation failed");
  }
}

// Rate limit ile korumalı endpoint
export const POST = withRateLimit(handleOfferCalculation, {
  limit: 20,
  windowMs: 60000, // Dakikada 20 teklif hesabı
});
