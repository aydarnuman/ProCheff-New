import { NextRequest, NextResponse } from "next/server";
import { extractTextWithAdvancedOCR } from "@/lib/ocr/clean-pro-converter";

// Next.js API route configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pro plan için temiz OCR endpoint
export async function POST(request: NextRequest) {
  try {
    console.log("🎯 PRO OCR: Starting processing...");

    // Form data al
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Buffer'a çevir
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileSizeMB = buffer.length / (1024 * 1024);

    console.log(`📄 File: ${file.name}, Size: ${fileSizeMB.toFixed(1)}MB`);

    // Pro OCR converter kullan
    const result = await extractTextWithAdvancedOCR(buffer, file.name);

    if (result.text && result.text.length > 0) {
      console.log(`✅ SUCCESS: ${result.text.length} chars extracted`);

      return NextResponse.json({
        extractedText: result.text,
        method: result.method,
        confidence: result.confidence,
        processingTime: result.meta.processingTime,
        fileSize: fileSizeMB,
        textLength: result.text.length,
        extractionChain: result.meta.extractionChain,
        message: "Pro OCR processing successful",
      });
    } else {
      console.log(`⚠️ No text extracted`);

      return NextResponse.json(
        {
          error: "No text could be extracted from the PDF",
          method: result.method,
          processingTime: result.meta.processingTime,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Pro OCR error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Processing failed",
        method: "error",
      },
      { status: 500 }
    );
  }
}
