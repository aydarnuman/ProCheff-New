import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "API çalışıyor",
    server: "ProCheff PDF Pipeline",
  });
}

export async function POST() {
  return GET();
}
