/**
 * Offer PT Recalculation Endpoint
 * PUT /api/offers/recalc - Mevcut tekliflerin PT'sini itemsData'dan yeniden hesaplar
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma as db } from "@/lib/core/database";
import { validateRequest, createApiResponse } from "@/lib/api/validation";
// SLI Metric recording (mock for now)
const recordSLIMetric = async (
  name: string,
  value: number,
  labels?: Record<string, any>
) => {
  console.log(`📊 SLI Metric: ${name} = ${value}`, labels);
};

// Request validation schema
const RecalcRequestSchema = z.object({
  offerIds: z.array(z.string().cuid()).optional(), // Specific offers, or all if empty
  force: z.boolean().default(false), // Force recalc even if PT matches
});

type RecalcRequest = z.infer<typeof RecalcRequestSchema>;

/**
 * PUT /api/offers/recalc
 * Mevcut tekliflerin PT'sini itemsData'dan yeniden hesaplar
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Request validation
    const validationResult = await validateRequest(
      request,
      RecalcRequestSchema
    );
    if (!validationResult.success) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          "Geçersiz istek",
          "VALIDATION_ERROR",
          validationResult.errors || []
        ),
        { status: 400 }
      );
    }

    const data = validationResult.data as RecalcRequest;

    // Find offers to recalculate
    const whereClause = data.offerIds?.length
      ? { id: { in: data.offerIds } }
      : {}; // All offers

    const offers = await db.offer.findMany({
      where: whereClause,
      select: {
        id: true,
        totalAmount: true,
        itemsData: true,
        metadata: true,
        tenderId: true,
        simulationId: true,
      },
    });

    if (offers.length === 0) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          "Recalc edilecek teklif bulunamadı",
          "NO_OFFERS_FOUND"
        ),
        { status: 404 }
      );
    }

    const results = {
      processed: 0,
      recalculated: 0,
      skipped: 0,
      errors: [] as Array<{ offerId: string; error: string }>,
    };

    // Process each offer
    for (const offer of offers) {
      try {
        results.processed++;

        // Calculate PT from itemsData
        const itemsData = Array.isArray(offer.itemsData)
          ? (offer.itemsData as Array<Record<string, unknown>>)
          : [];
        const calculatedPT = itemsData.reduce(
          (sum: number, item: Record<string, unknown>) => {
            const itemTotal =
              (Number(item.malzeme) || 0) +
              (Number(item.iscilik) || 0) +
              (Number(item.genel_gider) || 0) +
              (Number(item.brut_kar) || 0);
            return sum + itemTotal;
          },
          0
        );

        // Compare with existing totalAmount
        const currentPT = offer.totalAmount;
        const delta = Math.abs(calculatedPT - currentPT);
        const tolerance = 0.01; // 1 kuruş tolerance

        if (delta <= tolerance && !data.force) {
          results.skipped++;
          console.log(
            `Offer ${offer.id}: PT consistent (Δ ${delta.toFixed(2)}), skipping`
          );
          continue;
        }

        // Update offer with recalculated PT
        await db.offer.update({
          where: { id: offer.id },
          data: {
            totalAmount: calculatedPT,
            metadata: {
              ...((offer.metadata as any) || {}),
              recalc_history: [
                ...((offer.metadata as any)?.recalc_history || []),
                {
                  timestamp: new Date().toISOString(),
                  old_pt: currentPT,
                  new_pt: calculatedPT,
                  delta: calculatedPT - currentPT,
                  reason: "PT_RECALC_API",
                },
              ],
            },
          },
        });

        results.recalculated++;

        // Log recalculation
        console.log(
          `✅ Offer ${
            offer.id
          }: PT recalculated ${currentPT} → ${calculatedPT} (Δ ${(
            calculatedPT - currentPT
          ).toFixed(2)})`
        );

        // Record SLI metric
        await recordSLIMetric("pt_recalc_success", 1, {
          offer_id: offer.id,
          tender_id: offer.tenderId,
          delta: Math.abs(calculatedPT - currentPT),
        });
      } catch (error) {
        results.errors.push({
          offerId: offer.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        // Record error metric
        await recordSLIMetric("pt_recalc_error", 1, {
          offer_id: offer.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Final metrics
    const duration = Date.now() - startTime;
    await recordSLIMetric("pt_recalc_duration_ms", duration, {
      processed_count: results.processed,
      success_count: results.recalculated,
    });

    // Success response
    return NextResponse.json(
      createApiResponse(
        true,
        {
          summary: results,
          duration_ms: duration,
          message: `${results.recalculated}/${results.processed} teklif PT'si yeniden hesaplandı`,
        },
        "PT recalculation completed successfully"
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error("PT Recalc Error:", error);

    // Record error metric
    await recordSLIMetric("pt_recalc_fatal_error", 1, {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      createApiResponse(false, null, "PT recalculation failed", "RECALC_ERROR"),
      { status: 500 }
    );
  }
}

/**
 * GET /api/offers/recalc/status
 * PT consistency durumunu kontrol eder
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Find all offers with potential PT mismatches
    const offers = await db.offer.findMany({
      select: {
        id: true,
        totalAmount: true,
        itemsData: true,
        tenderId: true,
        createdAt: true,
      },
    });

    const analysis = {
      total_offers: offers.length,
      consistent: 0,
      inconsistent: [] as Array<{
        offer_id: string;
        tender_id: string;
        current_pt: number;
        calculated_pt: number;
        delta: number;
        delta_abs: number;
        created_at: Date;
      }>,
      tolerance: 0.01,
    };

    for (const offer of offers) {
      const itemsData = Array.isArray(offer.itemsData)
        ? (offer.itemsData as Array<Record<string, unknown>>)
        : [];
      const calculatedPT = itemsData.reduce(
        (sum: number, item: Record<string, unknown>) => {
          const itemTotal =
            (Number(item.malzeme) || 0) +
            (Number(item.iscilik) || 0) +
            (Number(item.genel_gider) || 0) +
            (Number(item.brut_kar) || 0);
          return sum + itemTotal;
        },
        0
      );

      const delta = Math.abs(calculatedPT - offer.totalAmount);

      if (delta <= analysis.tolerance) {
        analysis.consistent++;
      } else {
        analysis.inconsistent.push({
          offer_id: offer.id,
          tender_id: offer.tenderId,
          current_pt: offer.totalAmount,
          calculated_pt: calculatedPT,
          delta: calculatedPT - offer.totalAmount,
          delta_abs: delta,
          created_at: offer.createdAt,
        });
      }
    }

    return NextResponse.json(
      createApiResponse(
        true,
        analysis,
        `${analysis.consistent}/${analysis.total_offers} offers PT consistent`
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error("PT Status Check Error:", error);
    return NextResponse.json(
      createApiResponse(
        false,
        null,
        "PT status check failed",
        "STATUS_CHECK_ERROR"
      ),
      { status: 500 }
    );
  }
}
