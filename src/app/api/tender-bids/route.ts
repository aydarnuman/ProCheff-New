import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";
import { verifyAuth } from "@/lib/core/auth";

const prisma = new PrismaClient();

// Helper functions
function apiResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function validateRequired(data: any, fields: string[]) {
  const missing = fields.filter((field) => !data[field]);
  return {
    isValid: missing.length === 0,
    errors: missing.map((field) => `${field} is required`),
  };
}

// GET - Fetch Bids for a Tender
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenderId = searchParams.get("tenderId");

    if (!tenderId) {
      return apiResponse(
        {
          success: false,
          error: "İhale ID gerekli",
        },
        400
      );
    }

    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
      include: {
        bids: {
          include: {
            offer: {
              include: {
                client: { select: { name: true, email: true } },
              },
            },
          },
          orderBy: { bidAmount: "asc" },
        },
        restaurant: { select: { name: true, cuisine: true } },
      },
    });

    if (!tender) {
      return apiResponse(
        {
          success: false,
          error: "İhale bulunamadı",
        },
        404
      );
    }

    return apiResponse({
      success: true,
      data: { tender },
    });
  } catch (error) {
    console.error("Bids GET error:", error);
    return apiResponse(
      {
        success: false,
        error: "Teklifler getirilirken hata oluştu",
      },
      500
    );
  }
}

// POST - Submit New Bid
export async function POST(request: NextRequest) {
  try {
    // Skip auth for testing
    const authResult = { user: { id: "cmgzc97rj000061yiupfz4mes" } };

    const body = await request.json();
    const { tenderId, bidAmount, proposal, notes } = body;

    const validation = validateRequired(body, ["tenderId", "bidAmount"]);
    if (!validation.isValid) {
      return apiResponse(
        {
          success: false,
          error: "Gerekli alanlar eksik",
          details: validation.errors,
        },
        400
      );
    }

    // Check tender exists and is open
    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
      include: { restaurant: { select: { name: true } } },
    });

    if (!tender) {
      return apiResponse(
        {
          success: false,
          error: "İhale bulunamadı",
        },
        404
      );
    }

    if (tender.status !== "OPEN") {
      return apiResponse(
        {
          success: false,
          error: "Bu ihale teklife kapalı",
        },
        400
      );
    }

    // Create offer first
    const offer = await prisma.offer.create({
      data: {
        title: `${tender.title} için Teklif`,
        description:
          proposal || `${tender.restaurant.name} ihalesine sunulan teklif`,
        clientId: authResult.user.id,
        totalCost: bidAmount,
        estimatedRevenue: bidAmount * 1.2,
        status: "PENDING",
        validUntil: tender.deadline,
        deadline: tender.deadline,
      },
    });

    // Create tender bid
    const bid = await prisma.tenderBid.create({
      data: {
        tenderId,
        offerId: offer.id,
        bidAmount,
        proposal,
        notes,
        status: "SUBMITTED",
      },
      include: {
        tender: { select: { title: true } },
        offer: {
          include: {
            client: { select: { name: true, email: true } },
          },
        },
      },
    });

    return apiResponse({
      success: true,
      data: {
        bid,
        message: "Teklif başarıyla gönderildi",
      },
    });
  } catch (error) {
    console.error("Bid submission error:", error);
    return apiResponse(
      {
        success: false,
        error: "Teklif gönderilirken hata oluştu",
      },
      500
    );
  }
}
