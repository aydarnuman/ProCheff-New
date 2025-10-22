import { NextRequest, NextResponse } from "next/server";

// Pro plan için basit test endpoint
export async function POST(request: NextRequest) {
  try {
    console.log("🎯 PRO TEST: Simple OCR processing");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileSizeMB = buffer.length / (1024 * 1024);

    console.log(`📄 File: ${file.name}, Size: ${fileSizeMB.toFixed(1)}MB`);

    // Basit test response
    return NextResponse.json({
      extractedText: `Test başarılı! Dosya: ${
        file.name
      }, Boyut: ${fileSizeMB.toFixed(1)}MB`,
      method: "pro-test",
      confidence: 0.9,
      processingTime: 500,
      fileSize: fileSizeMB,
      textLength: 100,
      extractionChain: ["pro-test"],
      message: "Pro plan test successful - OCR.space integration ready",
    });
  } catch (error) {
    console.error("Pro test error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Processing failed",
        method: "error",
      },
      { status: 500 }
    );
  }
}
