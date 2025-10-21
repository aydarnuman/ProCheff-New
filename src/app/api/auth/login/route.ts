/**
 * ProCheff Authentication API
 * POST /api/auth/login - User login
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginUser } from "@/lib/core/auth";
import { ok, fail } from "@/lib/utils/response";

// Request validation schema
const LoginSchema = z.object({
  email: z.string().email("Geçerli bir email adresi giriniz"),
  password: z.string().min(1, "Şifre gereklidir"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        fail(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          validation.error.format()
        ),
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Login user
    const result = await loginUser(email, password);

    if (!result.success) {
      return NextResponse.json(fail(result.error || "Login failed", 401), {
        status: 401,
      });
    }

    // Return success response (without password)
    const { password: _, ...safeUser } = result.user!;

    return NextResponse.json(
      ok({
        user: safeUser,
        token: result.token,
        expiresAt: result.session!.expiresAt,
      })
    );
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(fail("Internal server error", 500), {
      status: 500,
    });
  }
}
