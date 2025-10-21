import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("🚀 STEP 1: API endpoint called!");

  try {
    // Test 1: Form data alabilir miyiz?
    console.log("📥 STEP 2: Getting form data...");
    const formData = await request.formData();
    console.log("✅ STEP 2: Form data received successfully");

    // Test 2: File var mı?
    console.log("📄 STEP 3: Looking for file...");
    const file = formData.get("file") as File;

    if (!file) {
      console.log("❌ STEP 3: No file found in form data");
      return NextResponse.json(
        {
          success: false,
          step: 3,
          error: "No file provided",
          formDataKeys: Array.from(formData.keys()),
        },
        { status: 400 }
      );
    }

    console.log("✅ STEP 3: File found!");
    console.log(
      `� File details: name=${file.name}, size=${file.size}, type=${file.type}`
    );

    // Test 3: File buffer alabilir miyiz?
    console.log("🔄 STEP 4: Converting file to buffer...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ STEP 4: Buffer created, size: ${buffer.length} bytes`);

    // Test 4: Alternative PDF parse - using quick-fallback
    console.log("📖 STEP 5: Trying alternative PDF parsing...");

    try {
      // Use our quick-fallback service that already handles pdf-parse issues
      const { extractTextWithFallback } = await import(
        "@/lib/ocr/quick-fallback"
      );
      const result = await extractTextWithFallback(buffer);

      console.log(`✅ STEP 5: Alternative PDF parsing successful!`);
      console.log(
        `📊 Method: ${result.method}, Confidence: ${result.confidence}`
      );
      console.log(`📝 Text length: ${result.text.length}`);
      console.log(`📝 First 100 chars: "${result.text.substring(0, 100)}"`);

      // SUCCESS - Return detailed info with extracted text
      return NextResponse.json({
        success: true,
        step: 5,
        message:
          "PDF processing successful - text extracted with fallback method",
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          bufferSize: buffer.length,
        },
        textExtraction: {
          method: result.method,
          confidence: result.confidence,
          processingTime: result.processingTime,
          textLength: result.text.length,
          preview: result.text.substring(0, 300),
          isEmpty: result.text.length === 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (parseError) {
      console.error("❌ STEP 5: PDF parse failed:", parseError);
      return NextResponse.json(
        {
          success: false,
          step: 5,
          error: "PDF parsing failed",
          details:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parse error",
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
            bufferSize: buffer.length,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ ERROR in step:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal error",
        step: "unknown",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PDF Upload Debug API - Step 1 Testing",
    endpoint: "POST /api/pipeline/pdf-to-offer",
    purpose: "Test basic file upload functionality",
    timestamp: new Date().toISOString(),
  });
}
