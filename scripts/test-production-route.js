// Quick Manual Test for Production Route
const fs = require("fs");
const path = require("path");

// Create minimal PDF for testing
function createTestPDF() {
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
(PMYO Test Document - İhale şartnamesi 4.500.000 TL) Tj
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

// Test production route directly
async function testProductionRoute() {
  console.log("🧪 Testing production route directly...");

  try {
    // Import the route handler
    const routeModule = require("../src/app/api/pipeline/pdf-to-offer/route.ts");

    if (!routeModule.POST) {
      console.log("❌ Route handler not found");
      return;
    }

    // Create test file
    const testPDF = createTestPDF();
    const testFile = new File([testPDF], "test-pmyo.pdf", {
      type: "application/pdf",
    });

    // Create mock FormData
    const formData = new FormData();
    formData.append("file", testFile);

    // Create mock request
    const mockRequest = {
      formData: () => Promise.resolve(formData),
      headers: {
        get: (name) =>
          name === "content-length" ? testPDF.length.toString() : null,
      },
    };

    console.log("📤 Calling POST handler...");
    const response = await routeModule.POST(mockRequest);
    const result = await response.json();

    console.log("📥 Response:", JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("✅ Production route test successful!");
    } else {
      console.log("❌ Production route test failed:", result.error);
    }
  } catch (error) {
    console.log("❌ Direct test error:", error.message);
    console.log("📝 Stack:", error.stack);
  }
}

// Run the test
testProductionRoute();
