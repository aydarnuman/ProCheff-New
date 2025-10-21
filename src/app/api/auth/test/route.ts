/**
 * ProCheff Authentication Test API
 * Simple test endpoint to verify auth system
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/database";
import { ok, fail } from "@/lib/utils/response";

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();

    return NextResponse.json(
      ok({
        message: "Authentication system ready",
        database: "connected",
        userCount,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Auth test error:", error);
    return NextResponse.json(fail("Database connection failed", 500), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "test-login":
        return NextResponse.json(
          ok({
            message: "Login endpoint ready",
            testData: data,
            timestamp: new Date().toISOString(),
          })
        );

      case "test-register":
        return NextResponse.json(
          ok({
            message: "Register endpoint ready",
            testData: data,
            timestamp: new Date().toISOString(),
          })
        );

      default:
        return NextResponse.json(fail("Unknown action", 400), { status: 400 });
    }
  } catch (error) {
    console.error("Auth test POST error:", error);
    return NextResponse.json(fail("Test failed", 500), { status: 500 });
  }
}
