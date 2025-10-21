/**
 * ProCheff Authentication API
 * POST /api/auth/logout - User logout
 * GET /api/auth/me - Get current user info
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, logoutUser } from "@/lib/core/auth";
import { ok, fail, unauthorized } from "@/lib/utils/response";

/**
 * GET /api/auth/me - Get current user info
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(unauthorized("Authentication token required"), {
        status: 401,
      });
    }

    const token = authHeader.substring(7);
    const context = await verifyAuth(token);

    if (!context) {
      return NextResponse.json(unauthorized("Invalid or expired token"), {
        status: 401,
      });
    }

    // Return user info (without password)
    const { password: _, ...safeUser } = context.user;

    return NextResponse.json(
      ok({
        user: safeUser,
        permissions: context.permissions,
        sessionExpiresAt: context.session.expiresAt,
      })
    );
  } catch (error) {
    console.error("Get user info error:", error);
    return NextResponse.json(fail("Internal server error", 500), {
      status: 500,
    });
  }
}

/**
 * POST /api/auth/logout - User logout
 */
export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(unauthorized("Authentication token required"), {
        status: 401,
      });
    }

    const token = authHeader.substring(7);
    const context = await verifyAuth(token);

    if (!context) {
      return NextResponse.json(unauthorized("Invalid or expired token"), {
        status: 401,
      });
    }

    // Logout user (invalidate session)
    const success = await logoutUser(context.session.id);

    if (!success) {
      return NextResponse.json(fail("Logout failed", 500), { status: 500 });
    }

    return NextResponse.json(ok({ message: "Successfully logged out" }));
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(fail("Internal server error", 500), {
      status: 500,
    });
  }
}
