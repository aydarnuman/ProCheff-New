#!/usr/bin/env node

/**
 * OCR.space Pro Plan Troubleshooting Script
 * Comprehensive diagnostics for Pro API issues
 */

const fs = require("fs");
const path = require("path");

async function troubleshootOCRSpace() {
  console.log("🔧 OCR.space Pro Plan Troubleshooting\n");

  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    console.error(
      "Missing OCR.space API key. Set the OCR_SPACE_API_KEY environment variable."
    );
    process.exit(1);
  }

  console.log("📋 Invoice Information:");
  console.log("   Plan: PRO PDF Plan ($60.00/month)");
  console.log("   License Key:", apiKey);
  console.log("   Next Payment: 21.11.2025");
  console.log("   Order Ref: OCR251021-9477-75109");
  console.log("");

  // Test different endpoints and methods
  const tests = [
    {
      name: "Basic URL Test (English)",
      config: {
        method: "POST",
        headers: { apikey: apiKey },
        body: new URLSearchParams({
          url: "https://via.placeholder.com/300x200/000000/FFFFFF?text=HELLO",
          language: "eng",
        }),
      },
    },
    {
      name: "Pro Engine Test (Turkish)",
      config: {
        method: "POST",
        headers: { apikey: apiKey },
        body: new URLSearchParams({
          url: "https://via.placeholder.com/300x200/000000/FFFFFF?text=MERHABA",
          language: "tur",
          OCREngine: "2",
        }),
      },
    },
    {
      name: "Legacy Engine Test",
      config: {
        method: "POST",
        headers: { apikey: apiKey },
        body: new URLSearchParams({
          url: "https://via.placeholder.com/300x200/000000/FFFFFF?text=TEST",
          language: "eng",
          OCREngine: "1",
        }),
      },
    },
  ];

  for (const test of tests) {
    console.log(`🧪 ${test.name}...`);

    try {
      const response = await fetch(
        "https://apipro1.ocr.space/parse/image",
        test.config
      );
      const result = await response.text();

      if (result === '"The API key is invalid"') {
        console.log("   ❌ API Key Invalid");
      } else if (result.includes("Error")) {
        console.log("   ⚠️  API Error:", result.substring(0, 100));
      } else {
        try {
          const json = JSON.parse(result);
          if (json.ParsedResults) {
            console.log("   ✅ SUCCESS! OCR Working");
            console.log(
              "   📝 Result:",
              json.ParsedResults[0]?.ParsedText || "No text"
            );
            return; // Success, no need to continue
          }
        } catch {
          console.log("   🤔 Unexpected response:", result.substring(0, 50));
        }
      }
    } catch (error) {
      console.log("   💥 Network Error:", error.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limit
  }

  console.log("\n🚨 All tests failed. Possible issues:");
  console.log("");
  console.log("1. 🕐 ACTIVATION PENDING");
  console.log("   - Pro plan just purchased (today: 21.10.2025)");
  console.log("   - API activation can take 24-48 hours");
  console.log("   - Check OCR.space dashboard for status");
  console.log("");
  console.log("2. 🔑 WRONG API KEY");
  console.log("   - Login to: https://ocr.space/ocrapi");
  console.log('   - Check "My API Key" section');
  console.log("   - Copy the EXACT key from dashboard");
  console.log("");
  console.log("3. 🌍 REGION/SERVER ISSUE");
  console.log("   - Try different API endpoint regions");
  console.log(
    "   - Contact OCR.space support with Order Ref: OCR251021-9477-75109"
  );
  console.log("");
  console.log("4. 📧 CONTACT SUPPORT");
  console.log("   - Email: support@ocr.space");
  console.log("   - Include: Order Reference OCR251021-9477-75109");
  console.log("   - Mention: Pro plan paid but API key not working");
  console.log("");

  console.log("💡 IMMEDIATE ACTIONS:");
  console.log("   1. Login to OCR.space dashboard");
  console.log("   2. Verify account status and API key");
  console.log("   3. If still failing, contact support with invoice");
}

// Run troubleshooting
troubleshootOCRSpace().catch(console.error);
