import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 PDF Upload API called");

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 }
      );
    }

    console.log("📄 File received:", file.name, file.size, file.type);

    // Basic response
    return NextResponse.json({
      success: true,
      message: "File received successfully",
      fileName: file.name,
      fileSize: file.size,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PDF Upload API is running",
    timestamp: new Date().toISOString(),
  });
}
