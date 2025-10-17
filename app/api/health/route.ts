import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const env = getEnv();
    const body = {
      status: "ok",
      service: "procheff",
      nodeEnv: env.NODE_ENV,
      version: process.env.GIT_SHA || "dev",
      checks: {
        secrets: {
          ANTHROPIC_API_KEY: true,
          OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY || false),
          NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET || false),
        },
      },
      time: new Date().toISOString(),
    };
    return NextResponse.json(body, { status: 200 });
  } catch (e: any) {
    log.error("health_failed", { err: e?.message });
    return NextResponse.json(
      { status: "fail", error: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
