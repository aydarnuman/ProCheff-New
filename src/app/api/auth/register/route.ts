/**
 * ProCheff Authentication API
 * POST /api/auth/register - User registration
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/core/auth";
import { ok, fail } from "@/lib/utils/response";

// Request validation schema
const RegisterSchema = z.object({
  email: z.string().email("Geçerli bir email adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  role: z
    .enum(["ADMIN", "MANAGER", "CLIENT", "SUPPLIER"])
    .optional()
    .default("CLIENT"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = RegisterSchema.safeParse(body);
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

    const { email, password, name, role } = validation.data;

    // Register user
    const result = await registerUser(email, password, name, role);

    if (!result.success) {
      return NextResponse.json(
        fail(result.error || "Registration failed", 400),
        { status: 400 }
      );
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
    console.error("Registration API error:", error);
    return NextResponse.json(fail("Internal server error", 500), {
      status: 500,
    });
  }
}
