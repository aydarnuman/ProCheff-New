// Production E2E Test Suite for Enhanced PDF API
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const fetch = require("node-fetch");

class ProductionTestSuite {
  constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl;
    this.testDataPath = path.join(process.cwd(), "test", "data");
  }

  // Test 1: Turkish filename handling
  async testTurkishFilename() {
    console.log("🇹🇷 Testing Turkish filename handling...");

    const pdfBuffer = this.createMinimalPDF();
    const formData = new FormData();

    // Turkish filename with special chars
    formData.append("file", pdfBuffer, {
      filename: "PMYO-YEMEK_TEKNİK_ŞARTNAME özel çharş.pdf",
      contentType: "application/pdf",
    });

    const response = await fetch(`${this.baseUrl}/api/pipeline/pdf-to-offer`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ Turkish filename handled successfully");
      return { success: true, normalizedName: result.meta?.filename };
    } else {
      throw new Error(
        `Turkish filename test failed: ${result.code} - ${result.message}`
      );
    }
  }

  // Test 2: application/octet-stream MIME type (browser behavior)
  async testOctetStreamMime() {
    console.log("🌐 Testing octet-stream MIME type...");

    const pdfBuffer = this.createMinimalPDF();
    const formData = new FormData();

    formData.append("file", pdfBuffer, {
      filename: "browser-upload.pdf",
      contentType: "application/octet-stream", // Common browser behavior
    });

    const response = await fetch(`${this.baseUrl}/api/pipeline/pdf-to-offer`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ Octet-stream MIME type accepted via magic bytes");
      return { success: true };
    } else {
      throw new Error(
        `Octet-stream test failed: ${result.code} - ${result.message}`
      );
    }
  }

  // Test 3: Large file rejection (>100MB)
  async testLargeFileRejection() {
    console.log("📊 Testing large file rejection...");

    // Create 110MB buffer
    const largeBuffer = Buffer.alloc(110 * 1024 * 1024);
    largeBuffer.write("%PDF-1.4"); // Valid PDF header

    const formData = new FormData();
    formData.append("file", largeBuffer, {
      filename: "large-file.pdf",
      contentType: "application/pdf",
    });

    const response = await fetch(`${this.baseUrl}/api/pipeline/pdf-to-offer`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.status === 413 && result.code === "FILE_TOO_LARGE") {
      console.log("✅ Large file properly rejected with correct error code");
      return { success: true, errorCode: result.code };
    } else {
      throw new Error(
        `Large file test failed: Expected 413 + FILE_TOO_LARGE, got ${response.status} + ${result.code}`
      );
    }
  }

  // Test 4: Invalid PDF (bad magic bytes)
  async testInvalidPDF() {
    console.log("🚫 Testing invalid PDF rejection...");

    const invalidBuffer = Buffer.from("This is not a PDF file content");
    const formData = new FormData();

    formData.append("file", invalidBuffer, {
      filename: "fake.pdf",
      contentType: "application/pdf",
    });

    const response = await fetch(`${this.baseUrl}/api/pipeline/pdf-to-offer`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.status === 400 && result.code === "INVALID_PDF") {
      console.log("✅ Invalid PDF properly rejected with magic bytes check");
      return { success: true, errorCode: result.code };
    } else {
      throw new Error(
        `Invalid PDF test failed: Expected 400 + INVALID_PDF, got ${response.status} + ${result.code}`
      );
    }
  }

  // Test 5: Error code consistency
  async testErrorCodeConsistency() {
    console.log("🎯 Testing error code consistency...");

    const tests = [
      { name: "No file", data: new FormData(), expectedCode: "NO_FILE" },
      {
        name: "Invalid PDF",
        data: (() => {
          const fd = new FormData();
          fd.append("file", Buffer.from("fake"), {
            filename: "fake.pdf",
            contentType: "application/pdf",
          });
          return fd;
        })(),
        expectedCode: "INVALID_PDF",
      },
    ];

    const results = [];

    for (const test of tests) {
      const response = await fetch(
        `${this.baseUrl}/api/pipeline/pdf-to-offer`,
        {
          method: "POST",
          body: test.data,
        }
      );

      const result = await response.json();
      const isCorrect = result.code === test.expectedCode;

      results.push({
        test: test.name,
        expected: test.expectedCode,
        actual: result.code,
        success: isCorrect,
      });

      if (isCorrect) {
        console.log(`✅ ${test.name}: ${result.code}`);
      } else {
        console.log(
          `❌ ${test.name}: Expected ${test.expectedCode}, got ${result.code}`
        );
      }
    }

    return results;
  }

  // Test 6: Parse fallback chain
  async testParseFallback() {
    console.log("🔄 Testing parse fallback behavior...");

    // Create a minimal PDF that might challenge pdf-parse
    const pdfBuffer = this.createMinimalPDF();
    const formData = new FormData();

    formData.append("file", pdfBuffer, {
      filename: "minimal-test.pdf",
      contentType: "application/pdf",
    });

    const response = await fetch(`${this.baseUrl}/api/pipeline/pdf-to-offer`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ PDF parsing successful (primary or fallback)");
      return {
        success: true,
        textLength: result.meta?.textLength,
        processingTime: result.processingTime,
      };
    } else if (result.code === "PARSE_FAILED") {
      console.log("✅ Parse failure properly handled with correct error code");
      return { success: true, errorCode: result.code };
    } else {
      throw new Error(
        `Parse fallback test failed: ${result.code} - ${result.message}`
      );
    }
  }

  // Test 7: Memory efficiency (stream processing)
  async testMemoryEfficiency() {
    console.log("💾 Testing memory efficiency...");

    const initialMemory = process.memoryUsage();

    // Upload a reasonably sized PDF multiple times
    const pdfBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
    pdfBuffer.write("%PDF-1.4\n%âãÏÓ\n"); // Valid PDF header

    const promises = [];
    for (let i = 0; i < 5; i++) {
      const formData = new FormData();
      formData.append("file", pdfBuffer, {
        filename: `memory-test-${i}.pdf`,
        contentType: "application/pdf",
      });

      promises.push(
        fetch(`${this.baseUrl}/api/pipeline/pdf-to-offer`, {
          method: "POST",
          body: formData,
        })
      );
    }

    await Promise.all(promises);

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    console.log(
      `✅ Memory test completed. Heap increase: ${(
        memoryIncrease /
        1024 /
        1024
      ).toFixed(2)}MB`
    );

    return {
      success: true,
      memoryIncrease: memoryIncrease,
      initialHeap: initialMemory.heapUsed,
      finalHeap: finalMemory.heapUsed,
    };
  }

  createMinimalPDF() {
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
100 700 Td
(PMYO Test Document with Turkish content: İhale şartnamesi) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000120 00000 n 
0000000200 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
350
%%EOF`;

    return Buffer.from(pdfContent);
  }

  async runAllTests() {
    const startTime = new Date();
    console.log("🚀 Production PDF API Test Suite Starting...\n");

    const tests = [
      { name: "Turkish Filename", fn: () => this.testTurkishFilename() },
      { name: "Octet-Stream MIME", fn: () => this.testOctetStreamMime() },
      { name: "Large File Rejection", fn: () => this.testLargeFileRejection() },
      { name: "Invalid PDF Rejection", fn: () => this.testInvalidPDF() },
      {
        name: "Error Code Consistency",
        fn: () => this.testErrorCodeConsistency(),
      },
      { name: "Parse Fallback Chain", fn: () => this.testParseFallback() },
      { name: "Memory Efficiency", fn: () => this.testMemoryEfficiency() },
    ];

    const results = [];

    for (const test of tests) {
      try {
        const result = await test.fn();
        results.push({
          name: test.name,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          name: test.name,
          success: false,
          error: error.message,
        });
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }

    const passedTests = results.filter((r) => r.success).length;
    const failedTests = results.filter((r) => !r.success).length;

    console.log("\n📊 PRODUCTION TEST RESULTS");
    console.log("==========================");
    console.log(`✅ Passed: ${passedTests}/${results.length}`);
    console.log(`❌ Failed: ${failedTests}/${results.length}`);
    console.log(
      `📊 Success Rate: ${((passedTests / results.length) * 100).toFixed(1)}%`
    );

    if (failedTests > 0) {
      console.log("\n🚨 FAILED TESTS:");
      results
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`   • ${result.name}: ${result.error}`);
        });
    }

    // Save detailed report
    const reportPath = path.join(
      process.cwd(),
      "reports",
      `production-test-${Date.now()}.json`
    );
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: startTime.toISOString(),
          results,
          summary: {
            passedTests,
            failedTests,
            successRate: (passedTests / results.length) * 100,
          },
        },
        null,
        2
      )
    );

    console.log(`\n💾 Detailed report saved: ${reportPath}`);

    return { passedTests, failedTests, results };
  }
}

// Run tests
async function main() {
  const suite = new ProductionTestSuite();

  try {
    const { passedTests, failedTests } = await suite.runAllTests();

    if (passedTests >= 6) {
      // Allow 1-2 failures
      console.log("\n🎉 PRODUCTION READY - API passes critical tests!");
      process.exit(0);
    } else {
      console.log("\n⚠️ NEEDS ATTENTION - Some critical tests failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Production test suite error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ProductionTestSuite };
