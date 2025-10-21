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

    // SUCCESS - Return detailed info
    return NextResponse.json({
      success: true,
      step: 4,
      message: "File upload successful - PDF ready for processing",
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        bufferSize: buffer.length,
      },
      timestamp: new Date().toISOString(),
    });
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
