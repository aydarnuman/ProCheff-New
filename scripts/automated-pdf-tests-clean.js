// Automated PDF Testing System
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const fetch = require("node-fetch");

class PDFTestRunner {
  constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl;
    this.testDataPath = path.join(process.cwd(), "test", "data");
  }

  async runTest(testName, testFn) {
    const startTime = Date.now();

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      return {
        testName,
        success: true,
        duration,
        details: result,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testHealthCheck() {
    const response = await fetch(
      `${this.baseUrl}/api/monitoring/pdf-health-check`
    );
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  }

  async testPMYODocument() {
    // Create a sample PMYO document for testing
    const sampleText = `
PMYO (Polis Meslek Yüksek Okulu) 
Yemek Hizmeti Teknik Şartnamesi

Tahmini Maliyet: 4.500.000 TL
Süre: 12 ay
Yaklaşık 2500 kişi için yemek hizmeti
Son Teslim Tarihi: 25.11.2025

Gereksinimler:
- ISO 22000 Gıda Güvenliği Sertifikası
- HACCP Sertifikası
- Minimum 3 yıl deneyim
- Mali yeterlilik belgesi

Öğün türleri:
- Kahvaltı
- Öğle yemeği  
- Akşam yemeği

İletişim: pmyo@example.gov.tr
    `;

    // Create a temporary PDF-like file for testing
    const tempFile = path.join(this.testDataPath, "temp-pmyo-test.txt");

    if (!fs.existsSync(this.testDataPath)) {
      fs.mkdirSync(this.testDataPath, { recursive: true });
    }

    fs.writeFileSync(tempFile, sampleText);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempFile), {
      filename: "pmyo-test.pdf",
      contentType: "application/pdf",
    });

    const response = await fetch(`${this.baseUrl}/api/pipeline/pdf-to-offer`, {
      method: "POST",
      body: formData,
    });

    // Clean up temp file
    fs.unlinkSync(tempFile);

    if (!response.ok) {
      throw new Error(`PDF analysis failed: ${response.status}`);
    }

    const result = await response.json();

    // Validate expected results
    if (!result.success) {
      throw new Error(`Analysis failed: ${result.message}`);
    }

    if (!result.panelData?.shartname) {
      throw new Error("No shartname analysis found");
    }

    const analysis = result.panelData.shartname;

    // Validate key fields
    if (!analysis.institution?.name?.includes("PMYO")) {
      throw new Error("Institution not properly detected");
    }

    if (analysis.tender?.estimatedValue !== 4500000) {
      throw new Error("Estimated value not properly extracted");
    }

    return {
      analysisResult: analysis,
      processingTime: result.processingTime,
      validated: true,
    };
  }

  async testInvalidFile() {
    const formData = new FormData();
    formData.append("file", Buffer.from("invalid content"), {
      filename: "test.txt",
      contentType: "text/plain",
    });

    const response = await fetch(`${this.baseUrl}/api/pipeline/pdf-to-offer`, {
      method: "POST",
      body: formData,
    });

    if (response.status !== 400) {
      throw new Error(`Expected 400 status, got ${response.status}`);
    }

    const result = await response.json();

    if (result.success !== false) {
      throw new Error("Invalid file should return success: false");
    }

    return { status: response.status, message: result.message };
  }

  async testLargeFile() {
    // Create a large buffer to simulate oversized file
    const largeBuffer = Buffer.alloc(110 * 1024 * 1024); // 110MB

    const formData = new FormData();
    formData.append("file", largeBuffer, {
      filename: "large-test.pdf",
      contentType: "application/pdf",
    });

    const response = await fetch(`${this.baseUrl}/api/pipeline/pdf-to-offer`, {
      method: "POST",
      body: formData,
    });

    if (response.status !== 413) {
      throw new Error(`Expected 413 status, got ${response.status}`);
    }

    return { status: response.status };
  }

  async testEmptyFile() {
    const formData = new FormData();
    // Don't append any file

    const response = await fetch(`${this.baseUrl}/api/pipeline/pdf-to-offer`, {
      method: "POST",
      body: formData,
    });

    if (response.status !== 400) {
      throw new Error(`Expected 400 status, got ${response.status}`);
    }

    return { status: response.status };
  }

  async runAllTests() {
    const startTime = new Date();

    console.log("🧪 PDF Analiz Sistemi Otomatik Test Başlıyor...\n");

    const tests = [
      this.runTest("Health Check", () => this.testHealthCheck()),
      this.runTest("PMYO Document Analysis", () => this.testPMYODocument()),
      this.runTest("Invalid File Handling", () => this.testInvalidFile()),
      this.runTest("Large File Rejection", () => this.testLargeFile()),
      this.runTest("Empty File Handling", () => this.testEmptyFile()),
    ];

    const results = await Promise.all(tests);

    const passedTests = results.filter((r) => r.success).length;
    const failedTests = results.filter((r) => !r.success).length;

    // Get system health after tests
    let systemHealth;
    try {
      systemHealth = await this.testHealthCheck();
    } catch (error) {
      systemHealth = { error: "Health check failed after tests" };
    }

    const report = {
      timestamp: startTime.toISOString(),
      totalTests: results.length,
      passedTests,
      failedTests,
      results,
      systemHealth,
    };

    return report;
  }

  printReport(report) {
    console.log("\n📊 TEST RAPORU");
    console.log("================");
    console.log(`🕒 Zaman: ${report.timestamp}`);
    console.log(`📈 Toplam Test: ${report.totalTests}`);
    console.log(`✅ Başarılı: ${report.passedTests}`);
    console.log(`❌ Başarısız: ${report.failedTests}`);
    console.log(
      `📊 Başarı Oranı: %${(
        (report.passedTests / report.totalTests) *
        100
      ).toFixed(1)}`
    );

    console.log("\n🔍 TEST DETAYLARI:");
    report.results.forEach((result) => {
      const icon = result.success ? "✅" : "❌";
      console.log(`${icon} ${result.testName} (${result.duration}ms)`);
      if (!result.success && result.error) {
        console.log(`   Hata: ${result.error}`);
      }
    });

    if (report.systemHealth?.status) {
      console.log(
        `\n🏥 Sistem Sağlığı: ${report.systemHealth.status.toUpperCase()}`
      );
      if (report.systemHealth.recommendations?.length > 0) {
        console.log("📋 Öneriler:");
        report.systemHealth.recommendations.forEach((rec) => {
          console.log(`   • ${rec}`);
        });
      }
    }

    // Save report to file
    const reportPath = path.join(
      process.cwd(),
      "reports",
      `automated-test-${Date.now()}.json`
    );
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Rapor kaydedildi: ${reportPath}`);
  }
}

// Main execution
async function main() {
  const runner = new PDFTestRunner();

  try {
    const report = await runner.runAllTests();
    runner.printReport(report);

    // Exit with error code if tests failed
    if (report.failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Test runner hatası:", error);
    process.exit(1);
  }
}

// Export for use as a module
module.exports = { PDFTestRunner };

// Run if called directly
if (require.main === module) {
  main();
}
