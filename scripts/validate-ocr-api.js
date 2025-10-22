#!/usr/bin/env node

/**
 * OCR.space API Key Validation Script
 * Tests if the configured API key is valid and shows usage information
 */

const fs = require("fs");
const path = require("path");

async function validateOCRSpaceAPI() {
  console.log("🔍 OCR.space API Key Validation\n");

  // Load environment variables
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env file not found");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const apiKeyMatch = envContent.match(
    /OCR_SPACE_API_KEY=["']?([^"'\n]+)["']?/
  );

  if (!apiKeyMatch) {
    console.error("❌ OCR_SPACE_API_KEY not found in .env");
    process.exit(1);
  }

  const apiKey = apiKeyMatch[1];
  console.log(
    `🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(
      apiKey.length - 4
    )}`
  );
  console.log(`📏 Key Length: ${apiKey.length} chars`);

  // Test with a simple image URL
  const testImageUrl = "https://i.imgur.com/A8eQsll.jpg";

  try {
    console.log("\n🧪 Testing API key with Pro endpoint...");

    const response = await fetch("https://apipro1.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        url: testImageUrl,
        language: "tur",
        filetype: "JPG",
        isOverlayRequired: "false",
        OCREngine: "2",
      }),
    });

    const result = await response.text();

    if (result === '"The API key is invalid"') {
      console.error("❌ API Key is INVALID");
      console.log("\n💡 Solutions:");
      console.log("1. Get a new API key from: https://ocr.space/ocrapi");
      console.log("2. Update your .env file with the new key");
      console.log("3. Make sure you have a Pro plan subscription");
      process.exit(1);
    }

    // Try to parse as JSON
    try {
      const jsonResult = JSON.parse(result);

      if (jsonResult.IsErroredOnProcessing) {
        console.error("❌ OCR Processing Error:", jsonResult.ErrorMessage);
        process.exit(1);
      }

      console.log("✅ API Key is VALID");
      console.log(
        `📊 Test Result: ${
          jsonResult.ParsedResults?.[0]?.ParsedText?.length || 0
        } characters extracted`
      );

      // Check if it's a Pro key
      const isPro = apiKey.length >= 10 || jsonResult.SearchablePDFURL; // Pro features (accept shorter license keys)
      console.log(`🎯 Plan Type: ${isPro ? "PRO" : "FREE"}`);

      if (!isPro) {
        console.warn("⚠️  Warning: This appears to be a FREE plan key");
        console.log("   - File size limit: ~5MB");
        console.log("   - Rate limits apply");
        console.log("   - Consider upgrading to Pro for better performance");
      } else {
        console.log("🚀 Pro Plan Features:");
        console.log("   - File size limit: 50MB");
        console.log("   - Higher rate limits");
        console.log("   - Advanced OCR engine");
      }
    } catch (parseError) {
      console.log("📋 Raw API Response:", result.substring(0, 200) + "...");
    }
  } catch (error) {
    console.error("❌ Network Error:", error.message);
    process.exit(1);
  }

  console.log("\n✅ Validation completed successfully");
}

// Run the validation
validateOCRSpaceAPI().catch(console.error);
