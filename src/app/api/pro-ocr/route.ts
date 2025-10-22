import { NextRequest, NextResponse } from "next/server";
import { extractTextWithAdvancedOCR } from "@/lib/ocr/clean-pro-converter";

// Next.js API route configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DEPRECATED: Use /pro-ocr-clean instead
export async function POST(request: NextRequest) {
  // Guard: Prevent duplicate endpoints
  if (process.env.PRO_OCR_DISABLED === "true") {
    return NextResponse.json(
      {
        error: "Deprecated endpoint. Use /api/pro-ocr-clean instead.",
        redirect: "/api/pro-ocr-clean",
      },
      { status: 410 } // Gone
    );
  }

  try {
    console.log(
      "⚠️ DEPRECATED: /pro-ocr endpoint used. Switch to /pro-ocr-clean"
    );

    // Content-Type kontrol et
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // File type validation
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Allowed: PDF, JPEG, PNG, WebP`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileSizeMB = buffer.length / (1024 * 1024);

    console.log(`📄 File: ${file.name}, Size: ${fileSizeMB.toFixed(1)}MB`);

    // Pro plan file size limit (OCR.space Pro: 50MB)
    const maxSizeMB = 45; // Safe margin under 50MB
    if (fileSizeMB > maxSizeMB) {
      return NextResponse.json(
        {
          error: `File too large: ${fileSizeMB.toFixed(
            1
          )}MB. Maximum: ${maxSizeMB}MB`,
        },
        { status: 400 }
      );
    }

    // API key validation is handled in the converter

    // Use the clean pro converter that handles OCR.space internally
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
    console.error("Pro OCR error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Processing failed",
        method: "error",
      },
      { status: 500 }
    );
  }
}
