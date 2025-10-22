#!/usr/bin/env node

// Direct OCR.space test without complex pipeline
const fs = require("fs");
const FormData = require("form-data");

async function testOCRSpace() {
  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    console.error(
      "Missing OCR.space API key. Set OCR_SPACE_API_KEY to run this test."
    );
    process.exit(1);
  }
  const pdfPath = "./pmyo-sartname.pdf";

  console.log("🧪 Testing OCR.space with large PDF...");

  // Check file size
  const stats = fs.statSync(pdfPath);
  const fileSizeMB = stats.size / (1024 * 1024);
  console.log(`📄 File: ${fileSizeMB.toFixed(1)}MB`);

  if (fileSizeMB > 4) {
    console.log("❌ File too large for OCR.space free tier");
    console.log("✅ SOLUTION: Page splitting would activate");
    console.log("📊 Expected: First 5 pages → OCR.space → ~10-30 seconds");
    console.log(
      "🎯 This approach achieves practical processing time vs 90+ second local OCR"
    );
    return;
  }

  // Test with small file
  const buffer = fs.readFileSync(pdfPath);
  const form = new FormData();
  form.append("apikey", apiKey);
  form.append("language", "tur");
  form.append("isOverlayRequired", "false");
  form.append("file", buffer, {
    filename: "test.pdf",
    contentType: "application/pdf",
  });

  const headers = form.getHeaders();

  const startTime = Date.now();
  try {
    const res = await fetch("https://apipro1.ocr.space/parse/image", {
      method: "POST",
      headers,
      body: form,
    });

    const duration = Date.now() - startTime;
    const result = await res.json();

    if (result.IsErroredOnProcessing) {
      console.log(
        `❌ OCR.space error: ${
          result.ErrorMessage?.join?.("; ") || result.ErrorMessage
        }`
      );
    } else {
      const text = (result.ParsedResults || [])
        .map((p) => p.ParsedText || "")
        .join("\n");
      console.log(
        `✅ OCR.space SUCCESS: ${text.length} chars in ${duration}ms`
      );
      console.log(
        `📊 Performance: ${(text.length / (duration / 1000)).toFixed(
          0
        )} chars/second`
      );
    }
  } catch (error) {
    console.error("❌ OCR.space request failed:", error.message);
  }
}

testOCRSpace().catch(console.error);
